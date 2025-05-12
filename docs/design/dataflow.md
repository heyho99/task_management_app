ルール参照済み!!!

まず、プロジェクトの構成を確認しましょう。

Read file: /home/ouchi/task_management_app/docs/design/configuration.txt
次に、プロジェクトの構造を確認します。

Ran tool
フロントエンドのコードを確認しましょう。

Ran tool

Ran tool
フロントエンドのJavaScriptコードを確認しましょう。

Ran tool
次に、認証サービスとタスク管理サービスの内容を確認します。

Read file: /home/ouchi/task_management_app/services/frontend/src/js/api.js

Read file: /home/ouchi/task_management_app/services/frontend/src/js/auth.js

Read file: /home/ouchi/task_management_app/services/frontend/src/js/tasks.js

Ran tool

Read file: /home/ouchi/task_management_app/services/auth-service/app/api/v1/auth.py

Read file: /home/ouchi/task_management_app/services/auth-service/app/core/security.py

Read file: /home/ouchi/task_management_app/services/task-service/app/api/v1/tasks.py
以上の情報を元に、このプロジェクトにおけるフロントエンドから認証サービス、タスク管理サービスへのデータの流れを解説します。

# フロントエンドから認証サービス、タスク管理サービスのデータの流れ

## 1. 認証サービスのデータフロー

### ユーザー認証の流れ
1. **ログイン処理**:
   - フロントエンドの `auth.js` から認証リクエストが送信されます
   - APIエンドポイント: `http://localhost:8001/api/auth/login`
   - ユーザー名とパスワードをフォームデータとして送信します
   - 認証サービスの `auth.py` の `login_for_access_token` 関数で処理されます
   - 認証サービスは `security.py` の `authenticate_user` 関数でユーザー認証を行います
   - 認証成功時にJWTトークンを生成して返します

2. **トークン管理**:
   - 認証サービスから返されたアクセストークンは `localStorage` に保存されます
   - 以降のAPIリクエストでは `Authorization: Bearer <token>` ヘッダーでトークンを送信します
   - トークンの期限切れ時には `refreshToken` 関数でトークンを更新します

3. **ユーザー情報取得**:
   - ログイン後、`getCurrentUser` 関数を使用してユーザー情報を取得します
   - APIエンドポイント: `http://localhost:8001/api/users/me`
   - 認証サービスの `get_current_active_user` 依存関数によりトークンの検証が行われます

## 2. タスク管理サービスのデータフロー

### タスク一覧取得
1. フロントエンドの `tasks.js` の `getTasks` 関数から `API.get('/v1/tasks/')` を呼び出します
2. `api.js` の `apiCall` 関数が `http://localhost:8002/api/v1/tasks/` にGETリクエストを送信します
3. リクエストには認証トークンが含まれます: `Authorization: Bearer <token>`
4. タスク管理サービスの `tasks.py` の `get_tasks` エンドポイントで処理されます
5. 認証処理として `get_current_user` 依存関数でユーザーを特定します
6. ユーザーIDに基づきデータベースからタスク一覧を取得し、レスポンスとして返します

### タスク詳細取得
1. `tasks.js` の `getTask` 関数から `API.get(/v1/tasks/${taskId})` を呼び出します
2. タスク管理サービスの `get_task` エンドポイントでタスクIDに基づく詳細情報を取得します
3. 取得したタスク情報はユーザーIDと照合されて権限チェックが行われます

### タスク作成・更新・削除
1. フロントエンドのフォームからタスクデータが収集されます
2. `tasks.js` の各関数から `API.post/put/delete` を呼び出します
3. タスク管理サービスの対応するエンドポイントでデータが処理されます
4. 全てのリクエストに認証トークンが含まれ、ユーザーの特定と権限チェックが行われます

## データフローの特徴

1. **マイクロサービスアーキテクチャ**:
   - 各サービスは独立したエンドポイントとデータベースを持ちます
   - フロントエンドは `api.js` を通じて各サービスと通信します

2. **認証の連携**:
   - 認証サービスで発行されたJWTトークンが他のサービスでも使用されます
   - 各サービスは認証トークンからユーザーIDを取得します

3. **エラーハンドリング**:
   - APIレスポンスがエラーの場合、フロントエンドでエラーメッセージが表示されます
   - 認証エラー(401)の場合はトークンの更新を試みます

4. **データの検証**:
   - フロントエンドでの入力検証（タスク作成・編集フォームなど）
   - バックエンドでのPydanticスキーマを使用したデータ検証

このアーキテクチャではフロントエンドがAPI Gatewayを通さず直接各サービスと通信しているのが特徴です。認証情報はJWTトークンとして全てのサービスで共有され、セキュリティと一貫性を確保しています。
