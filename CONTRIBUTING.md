# Contribuindo com o MacroKey

Este é um projeto privado. Mudanças devem ser discutidas e revisadas antes de chegarem à branch `main`.

## Fluxo recomendado

1. Crie uma branch curta a partir de `main`.
2. Use um nome descritivo, como `feat/importacao` ou `fix/atalho-global`.
3. Faça alterações pequenas e focadas.
4. Execute `npm run check` e `npm run build`.
5. Abra um pull request explicando o problema, a solução e como a mudança foi testada.

## Padrões do projeto

- Preserve a separação entre `main`, `preload`, `renderer` e `shared`.
- Não exponha APIs do Node.js diretamente ao renderer.
- Mantenha os contratos IPC tipados e com o menor escopo necessário.
- Evite dependências novas quando a plataforma ou o projeto já oferecem a funcionalidade.
- Não inclua `node_modules/`, `out/`, `dist/`, dados pessoais ou arquivos gerados nos commits.

## Commits

Prefira mensagens objetivas no formato Conventional Commits, por exemplo:

- `feat: adiciona duplicação de macros`
- `fix: cancela digitação ao pressionar escape`
- `refactor: simplifica persistência de configurações`
- `docs: atualiza instruções de desenvolvimento`

## Checklist do pull request

- [ ] A mudança tem um objetivo claro e não inclui alterações alheias.
- [ ] `npm run check` foi executado com sucesso.
- [ ] `npm run build` foi executado com sucesso.
- [ ] O comportamento visual ou nativo foi testado no Windows, quando aplicável.
- [ ] A documentação foi atualizada, quando necessária.
