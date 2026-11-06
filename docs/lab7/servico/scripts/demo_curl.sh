#!/usr/bin/env bash
# Demonstração da API com curl (servidor em execução em $BASE, padrão http://127.0.0.1:8000).
BASE=${BASE:-http://127.0.0.1:8000}
req() { # método caminho usuario perfil [corpo]
  local m=$1 p=$2 u=$3 pf=$4 b=$5
  echo "\$ curl -s -X $m $BASE$p -H 'X-Usuario-Id: $u' -H 'X-Perfil: $pf'${b:+ -d '$b'}"
  if [ -n "$b" ]; then
    curl -s -w '\nHTTP %{http_code}\n' -X "$m" "$BASE$p" -H "X-Usuario-Id: $u" -H "X-Perfil: $pf" \
      -H 'Content-Type: application/json' -d "$b" | python3 -c 'import sys,json
t=sys.stdin.read(); body,_,st=t.rpartition("\nHTTP ")
print(json.dumps(json.loads(body),ensure_ascii=False,indent=2)); print("HTTP "+st.strip())'
  else
    curl -s -w '\nHTTP %{http_code}\n' -X "$m" "$BASE$p" -H "X-Usuario-Id: $u" -H "X-Perfil: $pf" | python3 -c 'import sys,json
t=sys.stdin.read(); body,_,st=t.rpartition("\nHTTP ")
print(json.dumps(json.loads(body),ensure_ascii=False,indent=2)); print("HTTP "+st.strip())'
  fi
  echo
}
echo "### 1. verificarLimiteOrientandos (prof-02 está lotado)"
req GET /orientadores/prof-02/limite-orientandos prof-02 orientador
echo "### 2. responderProposta — aceite bloqueado pelo limite de orientandos"
req POST /propostas/prop-0002/resposta prof-02 orientador '{"decisao":"aceitar"}'
echo "### 3. responderProposta — recusa sem justificativa (regra de negócio)"
req POST /propostas/prop-0001/resposta prof-01 orientador '{"decisao":"recusar"}'
echo "### 4. responderProposta — entrada inválida"
req POST /propostas/prop-0001/resposta prof-01 orientador '{"decisao":"talvez"}'
echo "### 5. responderProposta — aceite válido (cria Trabalho de TCC e publica PropostaAceita)"
req POST /propostas/prop-0001/resposta prof-01 orientador '{"decisao":"aceitar","justificativa":"Tema alinhado à minha linha de pesquisa."}'
echo "### 6. responderProposta — proposta já respondida"
req POST /propostas/prop-0001/resposta prof-01 orientador '{"decisao":"recusar","justificativa":"Nova tentativa de resposta."}'
echo "### 7. submeterProposta — aluno-01"
req POST /propostas aluno-01 aluno '{"orientadorId":"prof-01","tema":"Painel de andamento de TCC","resumo":"Painel para o orientador acompanhar etapas, entregas e pendências.","objetivos":"Levantar requisitos; implementar; avaliar.","areaPesquisa":"Engenharia de Software"}'
echo "### 8. listarPropostas — orientador prof-01"
req GET /propostas prof-01 orientador
