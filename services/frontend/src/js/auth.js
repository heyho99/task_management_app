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