# Goya | Gestão de Projetos e Antecipações

Arquivos:
- index.html -> publicar no GitHub Pages
- Code.gs -> colar em um projeto Google Apps Script vinculado à planilha

## Estrutura criada
O sistema utiliza quatro abas:
1. PROJETOS
2. RECEBIMENTOS
3. VENDAS
4. PAGAMENTOS_FORNECEDORES

## Configuração
1. Crie uma planilha Google Sheets.
2. Copie o ID da planilha.
3. No Code.gs, substitua:
   COLE_AQUI_O_ID_DA_PLANILHA
4. No Apps Script, execute manualmente a função setup() uma vez e autorize.
5. Implantar > Nova implantação > Aplicativo da Web.
6. Executar como: você.
7. Quem tem acesso: qualquer pessoa com o link (ou conforme política interna da empresa).
8. Copie a URL /exec.
9. No index.html, substitua:
   COLE_AQUI_A_URL_DO_APPS_SCRIPT
10. Coloque index.html e copastur.png no mesmo repositório GitHub.
11. Ative o GitHub Pages.

## Regra financeira principal já implementada
Um pagamento a fornecedor com status "Pago" só é permitido se houver saldo financeiro efetivamente recebido no projeto.

Saldo disponível = recebimentos efetivos - pagamentos já realizados.

## Sugestões para uma próxima versão
- Usuários e perfis: consultor, financeiro, gestor e diretoria.
- Aprovação do Financeiro antes de pagar fornecedor.
- Upload de comprovantes.
- Importação automática de recebimentos da adquirente por número de autorização.
- Parcelamento automático: ao informar 10x, gerar as 10 parcelas.
- Linha do tempo por projeto.
- Alertas de parcela vencida.
- Campo centro de custo / unidade / empresa.
- Margem do projeto: valor de venda - custo fornecedor.
- Relatório por consultor, cliente, BKO e mês.
- Exportação Excel/PDF.
- Histórico de alterações / auditoria.
- Fechamento do projeto com cálculo automático de diferença final a cobrar ou devolver ao cliente.


## Identidade visual Goya
Esta versão foi atualizada conforme o Manual de Marca Goya:
- Cor principal: Pantone 7526 C / RGB 138, 57, 27 / #8A391B.
- Cor secundária: Pantone 2168 C / RGB 41, 71, 92 / #29475C.
- Tipografia web principal: Montserrat.
- White Label usa a marca principal.
- Black Label usa a versão branca oficial.
- O logo foi mantido sem distorções, efeitos, slogans ou alterações de proporção.
- Foram incluídos os quatro arquivos oficiais de logo enviados junto com o projeto.

Arquivos de marca no pacote:
- Logo.Goya-PrincipalRGB.png
- Logo.Goya-SecundarioRGB.png
- Logo.Goya-PretoRGB.png
- Logo.Goya-BrancoRGB.png
