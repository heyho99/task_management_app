/**
 * 認証関連の機能を提供するモジュール
 */
const Auth = {
    /**
     * 現在のユーザー情報
     */
    currentUser: null,
    
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
        try {
            // FormDataを使用してフォームデータを送信
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch(`${API.baseUrl}/v1/auth/login`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'ログインに失敗しました');
            }
            
            const data = await response.json();
            API.setToken(data.access_token);
            this.currentUser = await this.getCurrentUser();
            return this.currentUser;
        } catch (error) {
            console.error('ログインエラー:', error);
            throw error;
        }
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