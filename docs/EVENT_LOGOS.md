# Logotipos de Eventos

Esta funcionalidade permite que cada evento tenha seu próprio logotipo personalizado, que será exibido nos PDFs dos ingressos.

## Funcionalidades

### 1. Upload de Logotipo

- **Endpoint**: `POST /events/:id/logo`
- **Método**: Multipart Form Data
- **Campo**: `logo` (arquivo de imagem)
- **Permissões**: ADMIN, EVENT_MANAGER

**Exemplo de uso:**

```bash
curl -X POST http://localhost:3000/events/event-id/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/logo.png"
```

**Validações:**

- Tipos de arquivo permitidos: JPEG, JPG, PNG, GIF
- Tamanho máximo: 5MB
- Se já existir um logotipo, o anterior será substituído

### 2. Remoção de Logotipo

- **Endpoint**: `DELETE /events/:id/logo`
- **Permissões**: ADMIN, EVENT_MANAGER

**Exemplo de uso:**

```bash
curl -X DELETE http://localhost:3000/events/event-id/logo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Exibição no PDF

O logotipo do evento será automaticamente exibido no cabeçalho dos PDFs dos ingressos quando disponível.

### **Envio de PDF por Email (NOVO!)**

```json
POST /pdf/send-ticket-email
{
  "ticketId": "uuid-do-ingresso",
  "email": "cliente@email.com"
}
```

**Nota**: O sistema busca automaticamente o nome do participante e o nome do evento usando o `ticketId`, não sendo necessário enviar esses dados pelo front-end.

## Estrutura do Banco de Dados

### Tabela Event

```sql
ALTER TABLE "Event" ADD COLUMN "logoUrl" TEXT;
```

O campo `logoUrl` armazena a URL pública da imagem no R2 Storage.

## Armazenamento

Os logotipos são armazenados no R2 Storage (Cloudflare) com a seguinte estrutura:

- **Pasta**: `logos/`
- **Nome do arquivo**: `event-{eventId}-{timestamp}.png`
- **URL pública**: Configurada via variável de ambiente `R2_PUBLIC_URL`

## Template do PDF

O logotipo é exibido no template HTML do PDF com as seguintes características:

- **Posição**: Cabeçalho do ingresso
- **Tamanho máximo**: 200px de largura, 120px de altura
- **Design**: Layout limpo e profissional em uma única página
- **Responsivo**: Mantém proporções da imagem original
- **Logo Padrão**: Fallback automático para `https://pub-c1d09dbd294d4731b4e4d1f797d366c3.r2.dev/logos/logo-default.jpeg`
- **QR Code**: Gerado a partir do campo `qrCode` da tabela `EventTicket` (150x150px)

### Logo Padrão

Quando um evento não possui logotipo personalizado, o sistema automaticamente utiliza um logo padrão. Este logo está hospedado no R2 Storage e serve como fallback para garantir que todos os PDFs tenham uma identidade visual consistente.

**URL do Logo Padrão**: `https://pub-c1d09dbd294d4731b4e4d1f797d366c3.r2.dev/logos/logo-default.jpeg`

### QR Code

O QR Code é gerado automaticamente a partir do campo `qrCode` da tabela `EventTicket`. Este campo contém um identificador único que é usado para validação do ingresso no evento.

**Características do QR Code:**

- **Fonte**: Campo `qrCode` da tabela `EventTicket`
- **Tamanho**: 200x200px (container) / 180x180px (imagem)
- **Formato**: Data URL (base64)
- **Geração**: Automática via biblioteca `qrcode`
- **Configurações**:
  - Largura: 200px
  - Margem: 2px
  - Cores: Preto (#000000) sobre branco (#FFFFFF)
- **Validação**: Verificação de existência do campo antes da geração

## Exemplo de PDF com Logotipo

```
┌─────────────────────────────────────────────────────────┐
│                    [LOGO DO EVENTO]                     │
│                                                         │
│                    NOME DO EVENTO                       │
│     Apresente este voucher no dia do evento,            │
│     acompanhado de documento com foto.                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Detalhes do Evento                 │   │
│  │                                                 │   │
│  │ Data: 07/06/2025 - 16H ÀS 00H                  │   │
│  │ Local: R. QUINTINO BOCAIÚVA, 2607              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Informações do Participante           │   │
│  │                                                 │   │
│  │ [QR CODE]  Nome: Isabella Icanor Silva          │   │
│  │           CPF: 134.065.006-17                   │   │
│  │           Telefone: (34) 99335-8073             │   │
│  │           Email: isabella@email.com              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Este ingresso é pessoal e intransferível.             │
│  Apresente este documento na entrada do evento.        │
│  ID: abc123-def456                                      │
└─────────────────────────────────────────────────────────┘
```

## Características do Novo Design

1. **Layout Vertical**: Informações do evento e do participante em colunas separadas
2. **Design Limpo**: Bordas pretas e fundo branco para melhor legibilidade
3. **QR Code Integrado**: Posicionado junto às informações do participante (200x200px)
4. **Logotipo Prominente**: Exibido no topo do documento
5. **Logo Padrão**: Fallback automático quando não há logo específico do evento
6. **Instruções Claras**: Texto explicativo sobre apresentação do voucher
7. **Uma Página**: Todo o conteúdo organizado em uma única página A4

## Considerações Técnicas

1. **Performance**: As imagens são servidas diretamente do R2 Storage
2. **Segurança**: Apenas usuários autorizados podem fazer upload/remoção
3. **Validação**: Tipos de arquivo e tamanho são validados no servidor
4. **Fallback**: Logo padrão é usado automaticamente quando não há logo específico
5. **Limpeza**: Logotipos antigos são automaticamente removidos quando substituídos
6. **Impressão**: Otimizado para impressão com CSS específico para @media print
7. **QR Code**: Gerado automaticamente do campo `qrCode` da tabela `EventTicket` com validação

## Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_URL=your-public-url
```
