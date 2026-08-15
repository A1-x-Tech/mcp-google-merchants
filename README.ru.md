# <img src="./assets/a1-logo.svg" alt="A1" width="40"> Google Merchant Center MCP

[English](./README.md) | **Русский**

[![npm](https://img.shields.io/npm/v/mcp-google-merchants)](https://www.npmjs.com/package/mcp-google-merchants)
[![CI](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-merchants/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-merchants)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**A1 Google Merchant Center MCP** подключает AI-приложение к вашему аккаунту Google Merchant Center. Он помогает понять причины отклонения товаров, проверить фиды и промоакции, изучить отчёты и рыночные цены, а затем осознанно изменить данные товара, если это нужно.

Сервер работает с данными Merchant Center для товарных объявлений: товарами, источниками данных, промоакциями и отчётами. Кампании, бюджеты и ставки относятся к Google Ads — этот сервер ими не управляет.

- **22 инструмента.** 15 операций только читают данные Merchant Center; 5 меняют товары, источники данных или промоакции; 2 потенциально разрушительны.
- **Ваш доступ Google.** Сервер использует ваши OAuth-данные и Merchant API v1 — отдельный аккаунт Merchant Center он не создаёт.
- **Изменения с учётом источника.** Исходные данные товаров и промоакций можно менять только через API-источник. Файловый фид можно запросить повторно, но его содержимое сервер здесь не редактирует.
- **Видимые границы.** Инструменты помечены как read-only, write или destructive, поэтому AI-приложение может отличить проверку от изменения рабочих данных.

Начните с запроса, который только читает данные:

> Какие товары отклонены и какие проблемы указывает Google для каждого из них?

[Подключить сервер](#быстрый-старт) · [Посмотреть сценарии](#что-можно-поручить) · [Открыть техническую документацию](#техническая-документация)

---

## Увидеть работу за минуту

> **Вы:** Какие товары отклонены и какие проблемы указывает Google для каждого из них?
>
> **Ассистент:** Показывает затронутые товары и объясняет проблемы на уровне товара, которые сообщает Merchant Center.
>
> **Вы:** Покажи текущую цену и наличие товара `SKU-123`, затем подготовь изменение наличия на `in_stock`.
>
> **Ассистент:** Показывает текущие исходные данные товара, API-источник, которому они принадлежат, и точное изменение. Перед обновлением данных в Merchant Center он запрашивает подтверждение.
>
> **Вы:** Подтверждаю изменение.
>
> **Ассистент:** Отправляет обновление и поясняет, что Merchant Center обрабатывает товарные данные асинхронно. Обработанный товар и его статус качества могут обновиться через несколько минут.

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Что можно поручить](#что-можно-поручить)
- [Как связаны данные Merchant Center](#как-связаны-данные-merchant-center)
- [Что может измениться](#что-может-измениться)
- [Как получить доступ](#как-получить-доступ)
- [Конфигурация](#конфигурация)
- [Данные и телеметрия](#данные-и-телеметрия)
- [Ограничения и работа в фоне](#ограничения-и-работа-в-фоне)
- [Техническая документация](#техническая-документация)
- [Поддержка](#поддержка)

## Быстрый старт

Нужны Node.js 20+, аккаунт Google Merchant Center, OAuth-данные из Google Cloud и проект Google Cloud, зарегистрированный в Merchant Center. Как подготовить доступ, описано в разделе [«Как получить доступ»](#как-получить-доступ).

1. Подготовьте четыре значения: OAuth client ID, OAuth client secret, OAuth refresh token и ID аккаунта Merchant Center.
2. Добавьте сервер в AI-приложение по одной из инструкций ниже.
3. Отправьте первый запрос, который только читает данные.

<details open>
<summary><strong>Codex</strong></summary>

<br>

**В приложении:**

1. Откройте **Settings → Plugins → MCP servers**.
2. Нажмите **Add server**.
3. Добавьте команду запуска `npx -y mcp-google-merchants@latest` и четыре переменные окружения ниже.

| Переменная | Значение |
|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | Ваш Google OAuth client ID |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | Ваш Google OAuth client secret |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | Ваш Google OAuth refresh token |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | ID аккаунта Merchant Center |

**В командной строке:**

```bash
codex mcp add google-merchants \
  --env GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
  --env GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
  --env GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
  -- npx -y mcp-google-merchants@latest
```

Проверьте подключение:

```bash
codex mcp list
```

[Документация Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

</details>

<details>
<summary><strong>Claude Code</strong></summary>

<br>

```bash
claude mcp add \
  --env GOOGLE_MERCHANTS_CLIENT_ID=your_client_id \
  --env GOOGLE_MERCHANTS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_MERCHANTS_REFRESH_TOKEN=your_refresh_token \
  --env GOOGLE_MERCHANTS_ACCOUNT_ID=your_merchant_id \
  --transport stdio \
  --scope user \
  google-merchants \
  -- npx -y mcp-google-merchants@latest
```

Проверьте подключение:

```bash
claude mcp list
```

[Документация Claude Code MCP](https://code.claude.com/docs/en/mcp)

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

<br>

1. Откройте Claude Desktop и перейдите в **Settings → Developer**.
2. Нажмите **Edit Config**.
3. Добавьте сервер в `mcpServers`:

```json
{
  "mcpServers": {
    "google-merchants": {
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "your_client_id",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "your_refresh_token",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "your_merchant_id"
      }
    }
  }
}
```

Если **Edit Config** недоступна, откройте файл конфигурации вручную:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

[Документация Claude Desktop MCP](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

</details>

<details>
<summary><strong>Cursor</strong></summary>

<br>

Добавьте сервер уровня пользователя в `~/.cursor/mcp.json` на macOS/Linux или в `%USERPROFILE%\.cursor\mcp.json` на Windows:

```json
{
  "mcpServers": {
    "google-merchants": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "your_client_id",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "your_refresh_token",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "your_merchant_id"
      }
    }
  }
}
```

[Документация Cursor MCP](https://cursor.com/docs/mcp)

</details>

<details>
<summary><strong>VS Code</strong></summary>

<br>

Запустите **MCP: Open User Configuration** из Command Palette и добавьте:

```json
{
  "servers": {
    "google-merchants": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-google-merchants@latest"],
      "env": {
        "GOOGLE_MERCHANTS_CLIENT_ID": "${input:google_merchants_client_id}",
        "GOOGLE_MERCHANTS_CLIENT_SECRET": "${input:google_merchants_client_secret}",
        "GOOGLE_MERCHANTS_REFRESH_TOKEN": "${input:google_merchants_refresh_token}",
        "GOOGLE_MERCHANTS_ACCOUNT_ID": "${input:google_merchants_account_id}"
      }
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "google_merchants_client_id",
      "description": "Google OAuth client ID"
    },
    {
      "type": "promptString",
      "id": "google_merchants_client_secret",
      "description": "Google OAuth client secret",
      "password": true
    },
    {
      "type": "promptString",
      "id": "google_merchants_refresh_token",
      "description": "Google OAuth refresh token",
      "password": true
    },
    {
      "type": "promptString",
      "id": "google_merchants_account_id",
      "description": "ID аккаунта Merchant Center"
    }
  ]
}
```

Проверьте сервер командой **MCP: List Servers**.

[Документация VS Code MCP](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

</details>

## Что можно поручить

### Найти и понять проблемы каталога

- Какие товары отклонены и что Google сообщает по каждому из них?
- Покажи название, цену, наличие и текущий статус товара `SKU-123`.
- Какие товары отсутствуют на складе?
- Покажи самые частые проблемы товаров в этом аккаунте Merchant Center.

### Изучить результаты и цены

- Покажи клики и показы по товарам за июль.
- Какие товары в США стоят дороже рыночного ориентира?
- Какие цены рекомендует Google и какой эффект он прогнозирует?

Для сравнения с рынком и рекомендаций по цене нужно бесплатное подключение Market Insights в Merchant Center. Если аккаунт не подключён, сервер объяснит, почему отчёт не возвращает строки.

### Проверить аккаунт и фиды

- Покажи доступные мне аккаунты Merchant Center.
- Подтверждён ли сайт? Покажи текущие настройки доставки.
- Покажи источники данных товаров и промоакций и найди API-источник.
- Запусти вне расписания повторное получение этого файлового фида.

### Внести осознанные изменения

- Обнови цену и наличие этого товара в его API-источнике.
- Создай API-источник для нового товарного фида.
- Создай или обнови промоакцию, затем проверь её статус согласования.

Для любого запроса, который меняет данные, сначала попросите ассистента показать целевой аккаунт, источник данных и точные поля, которые он собирается изменить.

## Как связаны данные Merchant Center

Merchant Center хранит поступившие данные и итоговый статус товара раздельно:

1. В **аккаунте** находятся источники данных товаров и промоакций.
2. **Источник данных** может быть API-источником, файлом, Google Sheets, интерфейсом Merchant Center или автоматическим фидом.
3. **Исходные данные товара** — это данные, которые передал один источник.
4. **Обработанный товар** — результат обработки в Merchant Center. В нём содержатся допуски и проблемы на уровне товара.

Сервер читает все перечисленные типы источников. Создавать API-источники и обновлять исходные данные товара он может только в API-источнике; записывать в файл, интерфейс или автоматический фид он не умеет. Чтобы найти товары по условию, используйте отчётный запрос: у `list_products` нет серверной фильтрации.

## Что может измениться

| Операция | Что происходит | Граница подтверждения |
|---|---|---|
| Проверка аккаунтов, товаров, фидов, промоакций, отчётов, проблем и квот | Читает данные Merchant Center | Не меняет Merchant Center |
| Создание API-источника | Добавляет источник для товарных данных или промоакций | Меняет аккаунт |
| Обновление исходных данных товара | Меняет выбранные поля товара: например, цену или наличие | Меняет данные в рабочем источнике |
| Добавление исходных данных товара | Полностью заменяет данные с тем же ID в этом API-источнике; при другом источнике переносит товар | Меняет данные в рабочем источнике |
| Повторное получение файлового фида | Запрашивает внеплановое получение файла или Google Sheets | Запускает асинхронную работу у Google |
| Создание или обновление промоакции | Создаёт или меняет промоакцию | Меняет данные в рабочем источнике |
| Удаление исходных данных товара | Удаляет данные из выбранного источника | Разрушительное действие |
| Технический запрос Merchant API | Может вызвать метод API без отдельного инструмента | Потенциально разрушительное действие |

То, как AI-приложение запрашивает подтверждение операций записи и удаления, определяет само приложение. Сервер помечает операции как read-only, write и destructive, чтобы приложение могло показать нужную границу.

## Как получить доступ

Сервер использует [Google Merchant API](https://developers.google.com/merchant/api/overview) и OAuth scope `https://www.googleapis.com/auth/content`.

1. Создайте или выберите **проект Google Cloud**, включите **Merchant API** и настройте OAuth consent screen.
2. В Google Cloud создайте OAuth-клиент типа **Desktop app**. Сохраните его client ID и client secret.
3. Авторизуйте Google-аккаунт, у которого есть доступ к Merchant Center, и получите refresh token для указанного scope. В этом может помочь [OAuth 2.0 Playground](https://developers.google.com/oauthplayground): включите **Use your own OAuth credentials**, укажите scope, авторизуйтесь и обменяйте код на токены.
4. Найдите ID аккаунта Merchant Center и используйте его в `GOOGLE_MERCHANTS_ACCOUNT_ID`.
5. Один раз зарегистрируйте проект Google Cloud в Merchant Center. Для этого Google требует рабочий аккаунт Merchant Center с подтверждённым сайтом и права администратора. Регистрация связывает один проект Cloud с аккаунтом Merchant Center; пока она не завершена, вызовы Merchant API из этого проекта заблокированы. Следуйте [инструкции Google по регистрации разработчика](https://developers.google.com/merchant/api/guides/quickstart/registration).

Одноразовую регистрацию можно выполнить техническим инструментом `raw_request`, но при первой настройке Merchant API безопаснее следовать инструкции Google. После регистрации Google может начать принимать вызовы не сразу, а в течение пяти минут.

Храните OAuth client secret и refresh token как пароли. Они находятся в конфигурации MCP-клиента и могут давать доступ к аккаунту Merchant Center.

## Конфигурация

| Переменная | Обязательна | Описание |
|---|---|---|
| `GOOGLE_MERCHANTS_CLIENT_ID` | Да* | OAuth 2.0 client ID. |
| `GOOGLE_MERCHANTS_CLIENT_SECRET` | Да* | OAuth 2.0 client secret. |
| `GOOGLE_MERCHANTS_REFRESH_TOKEN` | Да* | OAuth refresh token с доступом Merchant API. |
| `GOOGLE_MERCHANTS_ACCESS_TOKEN` | Да* | Короткоживущая альтернатива трём OAuth-переменным выше. |
| `GOOGLE_MERCHANTS_ACCOUNT_ID` | Нет | ID аккаунта Merchant Center по умолчанию. В конкретном запросе можно выбрать другой доступный аккаунт. |
| `GOOGLE_MERCHANTS_API_BASE` | Нет | Переопределяет базовый URL Merchant API. |
| `GOOGLE_MERCHANTS_TOKEN_URL` | Нет | Переопределяет OAuth token endpoint. |
| `GOOGLE_MERCHANTS_TIMEOUT_MS` | Нет | Тайм-аут одного запроса в миллисекундах; по умолчанию `60000`. |
| `GOOGLE_MERCHANTS_MAX_RETRIES` | Нет | Максимальное число повторов при временных ошибках; по умолчанию `3`. |

\* Используйте либо client ID, client secret и refresh token вместе, либо заранее полученный access token. Access token обычно истекает примерно через час; refresh token позволяет серверу получать новый access token при необходимости.

## Данные и телеметрия

Сервер запускается локально как процесс из AI-приложения. Он отправляет запросы Merchant Center в Google и обновляет OAuth access tokens через OAuth endpoint Google.

Сервер отправляет анонимную телеметрию, чтобы считать активные установки и востребованность инструментов: случайный ID установки, версию пакета, версию AI-клиента, версии Node.js и операционной системы, а также имя инструмента. OAuth-токены, данные Merchant Center, аргументы инструментов и промпты он не отправляет и не хранит. Отключить телеметрию для MCP-серверов A1 можно так:

```bash
ASKADS_TELEMETRY=0
```

## Ограничения и работа в фоне

- **Merchant Center обрабатывает данные асинхронно.** Новый, изменённый или удалённый исходный товар может появиться среди обработанных товаров через несколько минут. Проблемы согласования товаров и промоакций возникают позже, а не как мгновенная ошибка API.
- **Market Insights подключается отдельно.** Отчёты о конкурентности цены и рекомендуемых ценах возвращают данные только после бесплатного подключения программы Market Insights.
- **Квоты зависят от аккаунта и метода API.** Текущее потребление показывает `list_method_quotas`; суточные счётчики Google сбрасываются в 12:00 UTC.
- **Временные лимиты обрабатываются осторожно.** При ответе Google `429` сервер учитывает `Retry-After`, если он передан, и делает ограниченное число повторов. После неопределённой сетевой или серверной ошибки он не повторяет запись.
- **Постоянного наблюдения нет.** Сервер работает только во время вызова из AI-приложения. Если приложение поддерживает задания по расписанию, ему можно поручить периодически проверять проблемы товаров или расход квоты.
- **У агрегированных проблем товаров есть ограничение по типу аккаунта.** `list_product_issues` работает для обычных аккаунтов и субаккаунтов, но не для родительских advanced-аккаунтов.

## Техническая документация

- [Все инструменты и их параметры](./docs/TOOLS.md)
- [Документация по разработке](./docs/DEVELOPMENT.md)
- [Документация по публикации](./docs/PUBLISHING.md)
- [Обзор Google Merchant API](https://developers.google.com/merchant/api/overview)
- [Аутентификация Google Merchant API](https://developers.google.com/merchant/api/guides/quickstart/authentication)
- [Регистрация разработчика в Google](https://developers.google.com/merchant/api/guides/quickstart/registration)

## Поддержка

Нашли ошибку или не хватает сценария? [Создайте issue](https://github.com/A1-x-Tech/mcp-google-merchants/issues) или напишите в [Telegram](https://t.me/a1_mcp).
