/**
 * 認証関連の機能を提供するモジュール
 */


// Authオブジェクトを作成
/**
{
    currentUser: null,
    isLoggedIn():ログイン済みかどうかのチェック
    login():ログイン処理
    logout():ログアウト処理
    getCurrentUser():現在のユーザー情報を取得
    initialize():初期化処理
}
 */
const Auth = {
    currentUser: null,
    
    /**
     * ログイン済みかどうかのチェック
     * @returns {boolean} ログイン済みの場合はtrue
     */
    isLoggedIn() {
        // API.getToken()でAPIにセットされているアクセストークンを取得し、取得結果がnullでない場合はtrueを返す
        return API.getToken() !== null;
    },
    
    /**
     * ログイン処理
     * @param {string} username - ユーザー名
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザー情報
     */
    async login(username, password) {
        // try catchでエラーを処理
        try {
            // FormDataオブジェクト(username,password)を作成
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            // formDataをAPIに送信してレスポンスを取得
            const response = await fetch(`${API.baseUrl}/v1/auth/login`, {
                method: 'POST',
                body: formData
            });
            
            // レスポンスがOK出ない場合はerrorDataにエラーメッセージを格納
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'ログインに失敗しました');
            }
            
            // data変数を用意し、レスポンス(アクセストークンが含まれる)をjson形式としてパースして格納
            const data = await response.json();
            // dataのaccess_tokenをAPIにセット API.setToken(アクセストークン)でアクセストークンをセット
            API.setToken(data.access_token);
            // thisはAuthオブジェクトを指し、AuthのcurrentUserプロパティにユーザー情報オブジェクトを格納
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
    // 現在ログインしているユーザーの情報をバックエンドAPIから取得する関数
    async getCurrentUser() {
        // isLoggedIn()を呼び出してfalseの場合はnullを返す
        if (!this.isLoggedIn()) {
            return null;
        }
        
        // すでにcurrentUserにユーザ情報が格納されているなら、再度APIに問い合わせる必要がないためcurrentUserを返す
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