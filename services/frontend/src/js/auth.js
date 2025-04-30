/**
 * 認証関連の機能を提供するモジュール
 */
const Auth = {
    /**
     * 現在のユーザー情報
     */
    currentUser: null,
    
    /**
     * テスト用のダミーユーザー
     */
    dummyUsers: [
        { id: 1, username: 'test', password: 'test', name: 'テストユーザー' },
        { id: 2, username: 'admin', password: 'admin', name: '管理者' }
    ],
    
    /**
     * テストモード（バックエンドなしでも動作するモード）
     */
    testMode: true,
    
    /**
     * ログイン済みかどうかのチェック
     * @returns {boolean} ログイン済みの場合はtrue
     */
    isLoggedIn() {
        return API.getToken() !== null;
    },
    
    /**
     * ログイン処理
     * @param {string} username - ユーザー名
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザー情報
     */
    async login(username, password) {
        // テストモードの場合はダミーユーザーでログイン
        if (this.testMode) {
            return this.dummyLogin(username, password);
        }
        
        // 本番モード: バックエンドAPIを使用
        try {
            const response = await API.post('/v1/auth/login', { username, password });
            API.setToken(response.access_token);
            this.currentUser = response.user;
            return response.user;
        } catch (error) {
            console.error('ログインエラー:', error);
            throw error;
        }
    },
    
    /**
     * ダミーログイン処理（テスト用）
     * @param {string} username - ユーザー名
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザー情報
     */
    async dummyLogin(username, password) {
        return new Promise((resolve, reject) => {
            // ダミーの処理遅延（実際のAPIリクエストを模倣）
            setTimeout(() => {
                // ダミーユーザーを検索
                const user = this.dummyUsers.find(
                    u => u.username === username && u.password === password
                );
                
                if (user) {
                    // ダミートークンを生成
                    const dummyToken = `dummy_token_${user.id}_${Date.now()}`;
                    API.setToken(dummyToken);
                    
                    // ユーザー情報をセット（パスワードは含めない）
                    const userData = { ...user };
                    delete userData.password;
                    this.currentUser = userData;
                    
                    resolve(userData);
                } else {
                    reject(new Error('ユーザー名またはパスワードが無効です。'));
                }
            }, 500); // 0.5秒の遅延
        });
    },
    
    /**
     * ログアウト処理
     */
    logout() {
        API.clearToken();
        this.currentUser = null;
        window.location.reload();
    },
    
    /**
     * 現在のユーザー情報を取得
     * @returns {Promise<Object>} ユーザー情報
     */
    async getCurrentUser() {
        if (!this.isLoggedIn()) {
            return null;
        }
        
        if (this.currentUser) {
            return this.currentUser;
        }
        
        // テストモードの場合はダミーユーザー情報を返す
        if (this.testMode) {
            // tokenからユーザーIDを抽出（ダミートークンの形式: dummy_token_{userId}_timestamp）
            const token = API.getToken();
            if (token && token.startsWith('dummy_token_')) {
                const userId = parseInt(token.split('_')[2]);
                const user = this.dummyUsers.find(u => u.id === userId);
                if (user) {
                    const userData = { ...user };
                    delete userData.password;
                    this.currentUser = userData;
                    return userData;
                }
            }
            return null;
        }
        
        // 本番モード: バックエンドAPIを使用
        try {
            const user = await API.get('/v1/auth/me');
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('ユーザー情報取得エラー:', error);
            // トークンが無効な場合はログアウト
            if (error.status === 401) {
                this.logout();
            }
            return null;
        }
    },
    
    /**
     * 初期化処理
     * @returns {Promise<boolean>} 初期化結果
     */
    async initialize() {
        // ログイン済みの場合はユーザー情報を取得
        if (this.isLoggedIn()) {
            await this.getCurrentUser();
            return true;
        }
        return false;
    }
};