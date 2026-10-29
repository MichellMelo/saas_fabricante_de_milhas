# Integração do histórico de emissões via Apps Script

## Endpoint

`POST /api/flight-availability/integration-import`

Autenticação máquina a máquina pelo header `x-integration-token`. Não use JWT de usuário nem credenciais de login no Google Apps Script.

## Variáveis no ambiente da API

- `FLIGHT_HISTORY_IMPORT_TOKEN`: segredo aleatório com pelo menos 32 caracteres. Configure no ambiente de execução da API e como Script Property no Google Apps Script. Não versione o valor.
- `FLIGHT_HISTORY_IMPORT_USER_ID`: ID interno do usuário `User.id` que será proprietário dos registros importados. Esse ID é resolvido no backend e não é aceito no payload.

A integração falha de forma fechada se as variáveis estiverem ausentes ou se o usuário de destino não existir/estiver inativo.

## Payload

Envie um lote no campo `records`, com até 2.000 itens:

```json
{
  "records": [
    {
      "dateRegistered": "2026-10-27T12:00:00.000Z",
      "program": "LATAM Pass",
      "cabinClass": "Executiva",
      "origin": "FOR",
      "destination": "MAD",
      "milesFloor": 85000,
      "monthsAvailable": "Nov/2026",
      "outboundDates": "10, 12",
      "returnDates": "20, 22"
    }
  ]
}
```

`dateRegistered` deve ser uma data ISO 8601 válida. Origem e destino devem ser códigos IATA de três letras. `milesFloor` deve ser um inteiro não negativo.

## Exemplo de chamada

```bash
curl -X POST "https://SEU-HOST/api/flight-availability/integration-import" \
  -H "Content-Type: application/json" \
  -H "x-integration-token: $FLIGHT_HISTORY_IMPORT_TOKEN" \
  --data @payload.json
```

## Resposta

A API informa `imported`, `skipped` e `total`. Duplicados são ignorados por fingerprint por usuário. Respostas esperadas incluem:

- `400`: payload inválido, vazio ou acima de 2.000 registros.
- `401`: token ausente/inválido.
- `503`: integração não configurada ou usuário de destino indisponível.

A implementação deste endpoint não configura automaticamente as variáveis do ambiente, não publica a API e não altera o Google Apps Script. Essas etapas precisam ser concluídas antes do uso real.
