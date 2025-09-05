# Vapt - Marketplace Estilo TikTok

## Sobre o Projeto

Vapt é um marketplace com interface inspirada no TikTok, permitindo que usuários anunciem e encontrem produtos através de um feed de rolagem vertical infinita. O projeto foi desenvolvido com HTML, CSS e JavaScript puro, utilizando localStorage para simular um banco de dados.

## Funcionalidades

### Cadastro/Login de Usuários
- Opções de criar conta com e-mail, telefone ou Google
- Perfil de usuário com nome, foto, telefone (WhatsApp) e localização

### Cadastro de Produtos
- Formulário completo para anunciar produtos
- Campos para nome, descrição, preço, categoria e localização
- Upload de múltiplas fotos e vídeos
- Associação automática ao usuário que cadastrou

### Feed Estilo TikTok
- Rolagem vertical infinita
- Cards ocupando quase toda a tela
- Exibição de imagem/vídeo do produto em destaque
- Informações como nome, preço e localização
- Botão para contato direto via WhatsApp
- Botões para curtir, favoritar e compartilhar

### Página de Produto
- Detalhes completos ao clicar no card
- Galeria de fotos/vídeos
- Descrição detalhada
- Informações do vendedor

### Favoritos
- Sistema para salvar produtos favoritos
- Página dedicada para visualizar itens salvos

### Banco de Dados (Simulado com localStorage)
- Tabela de Usuários
- Tabela de Produtos
- Tabela de Favoritos

## Como Executar

1. Clone este repositório
2. Abra o arquivo `index.html` em um navegador web

## Estrutura do Projeto

```
vapt-app/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos da aplicação
├── js/
│   └── app.js          # Lógica da aplicação
└── images/             # Diretório para imagens
```

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- localStorage para persistência de dados
- FontAwesome para ícones

## Recursos Futuros

- Filtros de busca (por categoria, cidade, preço)
- Chat interno entre compradores e vendedores
- Notificações push
- Melhorias de performance
- Integração com backend real

## Autor

Desenvolvido como projeto demonstrativo.