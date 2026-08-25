# Política de segurança

## Relatando uma vulnerabilidade

Não publique vulnerabilidades em uma issue. Envie os detalhes diretamente ao proprietário do repositório pelo recurso **Private vulnerability reporting** do GitHub, quando disponível, ou por um canal privado previamente combinado.

Inclua no relato:

- descrição do problema e impacto esperado;
- passos mínimos para reprodução;
- versão ou commit afetado;
- evidências relevantes, sem dados pessoais ou segredos;
- sugestão de correção, caso exista.

O relato será confirmado após a análise inicial. Informações sobre a correção e a divulgação serão compartilhadas pelo mesmo canal privado.

## Escopo

São especialmente relevantes problemas relacionados a:

- execução arbitrária de código;
- quebra do isolamento entre renderer, preload e processo principal;
- abuso dos atalhos globais ou da integração nativa com o Windows;
- exposição ou alteração indevida das macros armazenadas localmente;
- importação de arquivos `.macrokey` maliciosos.

Nunca inclua tokens, senhas, arquivos pessoais ou outros segredos em um relato.
