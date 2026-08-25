# MacroKey

[![CI](https://github.com/Eduardo00073/MarkKey/actions/workflows/ci.yml/badge.svg)](https://github.com/Eduardo00073/MarkKey/actions/workflows/ci.yml)
![Windows](https://img.shields.io/badge/plataforma-Windows-0078D4?logo=windows11&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

Aplicativo desktop para criar e executar macros de texto globalmente no Windows. O MacroKey monitora atalhos do teclado e envia o conteúdo configurado para o aplicativo que estiver em foco.

> Repositório privado. O código não possui licença para uso, cópia ou distribuição por terceiros.

## Recursos

- Atalhos globais simples ou combinados com `Ctrl`, `Shift`, `Alt` e `Meta`.
- Três modos de execução: Intercept, Auto-Type e Burst.
- Velocidade configurável e opção de digitação humanizada.
- HUD flutuante com progresso da macro em execução.
- Funcionamento em segundo plano pela bandeja do Windows.
- Tema claro ou escuro, salvo automaticamente.
- HUD de execução opcional e desativado por padrão.
- Inicialização com o Windows na versão instalada.
- Editor de texto baseado no Monaco Editor.
- Persistência local, favoritos, categorias e contador de uso.
- Importação e exportação no formato `.macrokey`.
- Variáveis dinâmicas resolvidas no momento da execução.

## Modos de execução

| Modo | Comportamento |
| --- | --- |
| **Intercept** | Cada tecla física pressionada envia o próximo caractere da macro. |
| **Auto-Type** | Digita o conteúdo automaticamente usando a velocidade configurada. |
| **Burst** | Envia todo o conteúdo imediatamente. |

`Escape` é reservado para cancelar uma macro em execução.

## Variáveis dinâmicas

| Variável | Resultado |
| --- | --- |
| `{{data}}` | Data atual no formato `DD/MM/AAAA`. |
| `{{data:ISO}}` | Data atual no formato `AAAA-MM-DD`. |
| `{{data:US}}` | Data atual no formato `MM/DD/AAAA`. |
| `{{hora}}` | Horário atual com segundos. |
| `{{hora:curta}}` | Horário atual sem segundos. |
| `{{timestamp}}` | Timestamp Unix atual em milissegundos. |
| `{{clipboard}}` | Texto presente na área de transferência. |
| `{{usuario}}` | Nome do usuário do Windows. |
| `{{hostname}}` | Nome do computador. |
| `{{random:6}}` | Número aleatório com a quantidade indicada de dígitos. |
| `{{uuid}}` | UUID v4. |
| `{{contador}}` | Número da próxima execução da macro. |
| `{{quebra}}` | Quebra de linha. |
| `{{tab}}` | Tabulação. |
| `{{saudacao}}` | Saudação adequada ao horário atual. |

## Tecnologias

- Electron 44 e electron-vite
- React 19 e TypeScript 5
- Monaco Editor
- `koffi` para integração com a API nativa do Windows
- `electron-store` para persistência local
- electron-builder para gerar o executável portátil

## Requisitos

- Windows 10 ou 11, x64
- Node.js 22.12 ou mais recente
- npm 10 ou mais recente

## Desenvolvimento

```powershell
npm install
npm run dev
```

Ao fechar a janela, o aplicativo continua executando na bandeja do Windows. Use **Sair** no menu da bandeja para encerrar o processo.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o aplicativo em modo de desenvolvimento. |
| `npm run check` | Valida tipos, código não utilizado, ciclos e vulnerabilidades. |
| `npm run typecheck` | Executa somente a validação do TypeScript. |
| `npm run build` | Gera os arquivos de produção em `out/`. |
| `npm run package` | Gera o executável portátil e o instalador em `dist/`. |
| `npm run package:portable` | Gera somente o executável portátil. |
| `npm run package:installer` | Gera somente o instalador do Windows. |

## Distribuição no Windows

O MacroKey pode ser distribuído de duas formas. Nenhuma delas exige Node.js, npm ou abertura do terminal no computador de destino.

| Arquivo | Uso |
| --- | --- |
| `MacroKey-Portable-1.0.0.exe` | Executável único. Basta copiar e abrir com duplo clique; não instala nada. |
| `MacroKey-Setup-1.0.0.exe` | Instalador tradicional, com escolha da pasta, atalhos e desinstalação pelo Windows. |

Os dois arquivos são gerados dentro de `dist/`. Como ainda não há assinatura digital, o Windows SmartScreen pode exibir um aviso ao abrir o programa em outro computador. Isso não impede a execução, mas uma distribuição pública profissional exigirá um certificado de assinatura de código.

Na versão instalada, **Iniciar com o Windows** vem habilitado e abre o MacroKey diretamente na bandeja. A opção pode ser alterada em **Preferências**. A versão portátil não oferece essa opção porque é extraída para um caminho temporário diferente a cada execução.

## Estrutura

```text
src/
├── main/       Processo principal, persistência, IPC, bandeja e engine
├── preload/    Ponte segura entre a interface e o processo principal
├── renderer/   Interface React, componentes e estilos
└── shared/     Tipos e contratos compartilhados
```

## Dados e segurança

- Os dados das macros permanecem localmente no computador por meio do `electron-store`.
- A interface usa isolamento de contexto e não recebe acesso direto ao Node.js.
- O preload expõe uma API limitada e tipada para as operações autorizadas.
- A integração contínua verifica tipos, dependências, código não utilizado, ciclos e build.

## Contribuição

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma branch ou pull request. Vulnerabilidades devem seguir o processo descrito em [SECURITY.md](SECURITY.md).

---

Copyright © 2026 Eduardo Junior Alcântara da Silva. Todos os direitos reservados.
