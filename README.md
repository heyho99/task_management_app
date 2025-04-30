# タスク管理アプリケーション

マイクロサービスアーキテクチャを使用した、タスク管理、時間記録、レポート作成機能を備えた統合ワークフロー管理システム。

## 機能概要

- ユーザー認証システム
- タスク管理（作成、割り当て、ステータス管理）
- 時間記録と分析
- グループと権限管理
- レポート生成
- LINE Bot連携

## システム構成

このアプリケーションは、以下のマイクロサービスで構成されています：

1. **API Gateway** - すべてのサービスへのエントリーポイント
2. **認証サービス** - ユーザー認証とセッション管理
3. **タスク管理サービス** - タスクとサブタスクの管理
4. **時間管理サービス** - 作業時間の記録と管理
5. **グループ管理サービス** - グループと権限の管理
6. **レポートサービス** - レポート生成と管理
7. **LINE Botサービス** - LINEプラットフォームとの連携
8. **フロントエンドサービス** - ユーザーインターフェース

## 技術スタック

- **バックエンド**: Python, FastAPI
- **フロントエンド**: HTML/CSS/JavaScript (初期段階), TypeScript + フレームワーク (将来的に)
- **データベース**: PostgreSQL
- **API Gateway**: Nginx
- **コンテナ化**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## セットアップ方法

### 前提条件

- Docker と Docker Compose がインストールされていること
- Git がインストールされていること

### インストール手順

1. リポジトリのクローン:

```bash
git clone https://github.com/yourusername/task_management_app.git
cd task_management_app
```

2. アプリケーションの起動:

```bash
docker-compose up -d
```

3. ブラウザで以下のURLにアクセス:

```
http://localhost
```

## 開発ガイド

### ディレクトリ構造

プロジェクトの詳細なディレクトリ構造については、[configuration.txt](configuration.txt) を参照してください。

### 新しいサービスの追加方法

1. `services/` ディレクトリに新しいサービスディレクトリを作成
2. サービス用の Dockerfile を作成
3. サービスのエンドポイントを API Gateway の設定に追加
4. docker-compose.yml に新しいサービスを追加

### テスト実行方法

各サービスのテストを実行するには:

```bash
cd services/[service-name]
pytest
```

## ライセンス

このプロジェクトは [MITライセンス](LICENSE) の下で提供されています。