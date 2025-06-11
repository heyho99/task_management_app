/**
 * タスク管理関連の機能を提供するモジュール
 */


/**
グローバルに公開されている関数（5個）
1. addSubtaskField
    呼び出し元:
        task-create.html（onclick属性）
        task-edit.html（onclick属性）
        initTaskCreationPage()内
        initTaskEditPage()内
    入力: subtaskData = null (オプション、既存サブタスクデータ)
    出力: なし（DOM操作でサブタスクフィールドを追加）
2. removeSubtask
    呼び出し元: 動的に生成されるサブタスクの削除ボタン（onclick属性）
    入力: button (HTMLElement - 削除ボタン要素)
    出力: なし（DOM操作でサブタスクを削除）
3. redistributeSubtaskContributions
    呼び出し元: 貢献値自動計算ボタン（click属性）
    入力: なし
    出力: なし（DOM操作で貢献値を均等分配）

4. validateSubtaskContributions
    呼び出し元: 
      - `initTaskEditPage()`内のフォーム送信処理（タスク編集時のバリデーション）
      - `addSubtaskField()`関数内（サブタスク追加後のバリデーション）
      - `redistributeContributionValues()`関数内（貢献値再分配後のバリデーション）
      - `handleTaskSubmit()`関数内（タスク作成時のバリデーション）
    入力: なし（DOM要素から値を取得）
    出力: `boolean` (バリデーション結果、100%に近い値かをチェック)



非公開（内部）関数（16個）

1. calculateInitialValues
    呼び出し元: updateInitialValues()内
    入力: formData (Object - フォームデータ)
    出力: Promise (計算結果)
2. initTaskCreationPage
    呼び出し元: DOMContentLoadedイベントリスナー内
    出力: なし（ページ初期化）
3. initTaskEditPage
    呼び出し元: DOMContentLoadedイベントリスナー内
    出力: なし（ページ初期化）
4. loadTaskForEdit
    呼び出し元: initTaskEditPage()内
    入力: taskId (string - タスクID)
    出力: Promise (非同期処理)
5. updateInitialValues
    呼び出し元: 日付・時間入力フィールドのchangeイベント
    入力: なし（DOM要素から値を取得）
    出力: Promise (非同期処理)
6. updateDailyTaskPlans
    呼び出し元: updateInitialValues()内
    入力: dailyTaskPlans (Array - 日次作業計画値値)
    出力: なし（DOM更新）
7. updateDailyTimePlans
    呼び出し元: updateInitialValues()内
    入力: dailyTimePlans (Array - 日次作業時間計画値値)
    出力: なし（DOM更新）
8. updateSubtaskContributions
    呼び出し元: updateInitialValues()内
    入力: contributionValue (number - 貢献値)
    出力: なし（DOM更新）
9. validateDailyTaskPlans
    呼び出し元: フォーム送信時、計画値変更時
    入力: なし（DOM要素から値を取得）
    出力: boolean (バリデーション結果)
10. validateDailyTimePlans
    呼び出し元: フォーム送信時、計画値変更時
    入力: なし（DOM要素から値を取得）
    出力: boolean (バリデーション結果)
11. handleTaskSubmit
    呼び出し元: タスク作成フォームのsubmitイベント
    入力: event (Event - フォーム送信イベント)
    出力: Promise (非同期処理)
12. collectSubtasks
    呼び出し元: handleTaskSubmit()内、タスク編集フォーム送信時
    入力: なし（DOM要素から値を取得）
    出力: Array (サブタスク情報配列)
13. collectDailyTaskPlans
    呼び出し元: handleTaskSubmit()内、タスク編集フォーム送信時
    入力: なし（DOM要素から値を取得）
    出力: Array (日次作業計画値配列)
14. collectDailyTimePlans
    呼び出し元: handleTaskSubmit()内、タスク編集フォーム送信時
    入力: なし（DOM要素から値を取得）
    出力: Array (日次作業時間計画値配列)
15. 無名関数（DOMContentLoadedイベントリスナー）
    呼び出し元: ページ読み込み完了時
    出力: なし（ページ初期化の振り分け）
16. 無名関数（タスク編集フォーム送信）
    呼び出し元: タスク編集フォームのsubmitイベント
    入力: event (Event - フォーム送信イベント)
    出力: Promise (非同期処理)
*/


/**
 * フロントエンドで日次計画値を計算する
 * @returns {Object} - 計算結果 {daily_task_plans: Array, daily_time_plans: Array}
 */
function calculateDailyPlans() {
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    const targetTime = parseInt(document.getElementById('target-time').value);
    
    if (!startDate || !dueDate || !targetTime) {
        return null;
    }
    
    // 開始日から終了日までの日数を計算（両端を含む）
    const start = new Date(startDate);
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - start.getTime();
    const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    if (dayCount <= 0) {
        alert('終了日は開始日より後に設定してください');
        return null;
    }
    
    // 日次作業計画値（100%を日数で均等分配）
    const dailyTaskPlanValue = (100 / dayCount);
    
    // 日次作業時間計画値（目標時間を日数で均等分配）
    const dailyTimePlanValue = (targetTime / dayCount);
    
    // 日付ごとの配列を生成
    const daily_task_plans = [];
    const daily_time_plans = [];
    
    for (let i = 0; i < dayCount; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        daily_task_plans.push({
            date: dateStr,
            task_plan_value: dailyTaskPlanValue
        });
        
        daily_time_plans.push({
            date: dateStr,
            time_plan_value: dailyTimePlanValue
        });
    }
    
    return {
        daily_task_plans,
        daily_time_plans
    };
}



/**
 タスク作成ページ(task-create.html)の初期化（静的なHTMLに動的な機能を追加する）
 * サブタスク追加ボタンにイベントリスナーを追加する
 * 開始日、終了日、目標時間フォームのそれぞれに、値の変更があった時にupdatePlansAndContributions関数を呼び出すイベントリスナーを追加
 * 1個目のサブタスクフィールドを追加
 * タスク作成フォームの送信ボタン<button type="submit">を押したら、handleTaskSubmit関数を呼び出す
 */
function initTaskCreationPage() {
    console.log('initTaskCreationPage関数が呼び出されました');
    const form = document.getElementById('task-create-form'); // タスク作成フォーム全体
    const addSubtaskBtn = document.getElementById('add-subtask'); // サブタスク追加ボタン
    const startDateInput = document.getElementById('start-date'); // 開始日
    const dueDateInput = document.getElementById('due-date'); // 終了日
    const targetTimeInput = document.getElementById('target-time'); // 目標時間入力フォーム

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // サブタスク追加ボタンに、イベントリスナーを追加
    if (addSubtaskBtn) {
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            // サブタスクフィールドを追加
            addSubtaskField();
        };
    }

    // 計画値自動計算ボタンにイベントリスナーを追加
    const calculateButton = document.getElementById('calculate-initial-values');
    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            console.log('計画値自動計算ボタンがクリックされました');
            updatePlansAndContributions();
        });
    }

    // 貢献値自動計算ボタンにイベントリスナーを追加
    const redistributeButton = document.getElementById('redistribute-contributions');
    if (redistributeButton) {
        redistributeButton.addEventListener('click', function() {
            console.log('貢献値自動計算ボタンがクリックされました');
            redistributeSubtaskContributions();
        });
    }

    // 1個目のサブタスク追加
    addSubtaskField();

    // タスク作成フォームの送信ボタン<button type="submit">を押したら、handleTaskSubmit関数を呼び出すように設定
    if (form) {
        form.addEventListener('submit', handleTaskSubmit);
    }
}



/**
 タスク編集ページ(task-edit.html)の初期化（静的なHTMLに動的な機能を追加する）
 * サブタスク追加ボタンにイベントリスナーを追加する
 * 開始日、終了日、目標時間フォームのそれぞれに、値の変更があった時にupdatePlansAndContributions関数を呼び出すイベントリスナーを追加
 * 1個目のサブタスクフィールドを追加
 * タスク編集フォームの送信ボタン<button type="submit">を押したら、以下の関数を呼び出す
    * バリデーション
    * フォームデータの収集
    * タスク本体の更新
    * サブタスクの作成・更新・削除
    * サブタスク処理完了後、タスク一覧ページにリダイレクト
 */
function initTaskEditPage() {
    console.log('initTaskEditPage関数が呼び出されました');
    const form = document.getElementById('task-edit-form'); // タスク編集フォーム全体  
    const addSubtaskBtn = document.getElementById('add-subtask'); // サブタスク追加ボタン
    const startDateInput = document.getElementById('start-date'); // 開始日
    const dueDateInput = document.getElementById('due-date'); // 終了日
    const targetTimeInput = document.getElementById('target-time'); // 目標時間入力フォーム

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // ページのURL(https://example.com/edit_task.html?id=123&mode=edit)のクエリ文字列を取得
    const urlParams = new URLSearchParams(window.location.search); // クエリ文字　?id=123&mode=edit
    const taskId = urlParams.get('id'); //123


    // タスクIDに基づいてタスク情報を読み込んで、html要素に表示
    loadTaskForEdit(taskId);


    // サブタスク追加ボタンのイベントリスナーを設定
    if (addSubtaskBtn) {
        console.log('サブタスク追加ボタンにイベントリスナーを追加します');
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            // サブタスクフィールドを追加
            addSubtaskField(); 
        };
    }

    // 計画値自動計算ボタンにイベントリスナーを追加
    const calculateButton = document.getElementById('calculate-initial-values');
    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            console.log('計画値自動計算ボタンがクリックされました');
            updatePlansAndContributions();
        });
    }

    // 貢献値自動計算ボタンにイベントリスナーを追加
    const redistributeButton = document.getElementById('redistribute-contributions');
    if (redistributeButton) {
        redistributeButton.addEventListener('click', function() {
            console.log('貢献値自動計算ボタンがクリックされました');
            redistributeSubtaskContributions();
        });
    }


    // タスク編集フォームの送信ボタン<button type="submit">を押したら、下記関数を呼び出すように設定
    if (form) {
        form.addEventListener('submit', async (event) => {

            // フォームのデフォルトの送信動作（ページのリロードなど）をキャンセル
            // これにより、JavaScriptで非同期にデータを処理できるようになる
            event.preventDefault();
            
            // バリデーション
            const isTaskPlansValid = validateDailyTaskPlans(); // 日次作業計画値のバリデーション
            const isTimePlansValid = validateDailyTimePlans(); // 日次作業時間計画値のバリデーション
            const isSubtasksValid = validateSubtaskContributions(); // サブタスク貢献値のバリデーション
            
            // 全てのバリデーションをチェックし、falseの場合はreturn（送信処理を中断してページ遷移もしない）
            if (!isTaskPlansValid || !isTimePlansValid || !isSubtasksValid) {
                return;
            }
            
            try {
                // フォーム送信ボタンを押したとき、残っているエラーメッセージを事前に非表示
                const errorElement = document.getElementById('error-message');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                

                // デバッグ用
                // 現在存在するサブタスクIDを取得
                console.log('タスクID:', taskId);
                // APIにタスクIDを渡し、DBからサブタスク情報を取得する
                const existingSubtasks = await ApiClient.task.getSubtasks(taskId); 
                console.log('既存のサブタスク:', existingSubtasks);
                const existingSubtaskIds = existingSubtasks.map(s => s.subtask_id.toString());
                console.log('既存のサブタスクID:', existingSubtaskIds);

                // ユーザーがフォームに入力したサブタスク情報を収集
                const currentSubtasks = collectSubtasks();
                console.log('現在のサブタスク:', currentSubtasks);
                


                // サブタスクの更新がうまくいっていない！！！！！！！！！！！
                // ・

                // 更新ボタンを押した時に、フォームデータの収集（サブタスクを除く）
                const formData = {
                    task_name: document.getElementById('task-name').value, // タスク名
                    task_content: document.getElementById('task-content').value, // タスク内容
                    recent_schedule: document.getElementById('recent-schedule').value, // 直近の予定
                    start_date: document.getElementById('start-date').value, // 開始予定日
                    due_date: document.getElementById('due-date').value, // 完了予定日
                    category: document.getElementById('category').value, // カテゴリー
                    target_time: parseInt(document.getElementById('target-time').value), // 目標作業時間
                    comment: document.getElementById('comment').value || '', // コメント
                    
                    // 日次作業計画値
                    daily_task_plans: collectDailyTaskPlans(),
                    
                    // 日次作業時間計画値
                    daily_time_plans: collectDailyTimePlans()
                };
                
                console.log('更新するタスクデータ:', JSON.stringify(formData));
                
                // 1. まずタスクテーブルのタスク本体を更新
                try {               
                    console.log('タスク本体更新開始...');
                    const updatedTask = await ApiClient.task.updateTask(taskId, formData);
                    console.log('タスク本体更新完了:', updatedTask);
                } catch (taskUpdateError) {
                    console.error('タスク本体更新に失敗:', taskUpdateError);
                    throw new Error(`タスク本体の更新に失敗しました: ${taskUpdateError.message}`);
                }

                // 2. サブタスクの作成・更新・削除を処理
                const subtaskPromises = [];
                const subtaskErrors = [];
                
                console.log('サブタスク処理開始...');
                
                for (const subtask of currentSubtasks) {
                    // ユーザーが入力したサブタスクIDが既に存在する場合は、更新処理を行う
                    if (subtask.subtask_id) {
                        // 更新
                        console.log(`サブタスク更新: ID=${subtask.subtask_id}`, subtask);
                        subtaskPromises.push(
                            ApiClient.task.updateSubtask(subtask.subtask_id, {
                                subtask_name: subtask.subtask_name,
                                contribution_value: subtask.contribution_value
                            }).catch(err => {
                                console.error(`サブタスク更新エラー: ID=${subtask.subtask_id}`, err);
                                subtaskErrors.push(`サブタスク「${subtask.subtask_name}」の更新に失敗: ${err.message}`);
                                return null;
                            })
                        );
                    } else {
                        // サブタスクIDがない場合は、新規作成
                        console.log(`サブタスク作成: タスクID=${taskId}`, subtask);
                        
                        // APIに送信するデータを整形
                        const newSubtaskData = {
                            subtask_name: subtask.subtask_name,
                            contribution_value: subtask.contribution_value
                        };
                        console.log('新規サブタスク送信データ:', newSubtaskData);
                        
                        // 貢献値のバリデーション（小数点表示を修正）
                        if (newSubtaskData.contribution_value % 1 !== 0) {
                            newSubtaskData.contribution_value = parseFloat(newSubtaskData.contribution_value.toFixed(2));
                        }
                        
                        subtaskPromises.push(
                            ApiClient.task.createSubtask(taskId, newSubtaskData)
                                .then(response => {
                                    console.log('サブタスク作成成功:', response);
                                    return response;
                                })
                                .catch(err => {
                                    console.error(`サブタスク作成エラー: ${subtask.subtask_name}`, err);
                                    subtaskErrors.push(`サブタスク「${subtask.subtask_name}」の作成に失敗: ${err.message}`);
                                    return null;
                                })
                        );
                    }
                }
                
                // 削除対象のサブタスクを特定
                const currentSubtaskIds = currentSubtasks
                    .filter(s => s.subtask_id)
                    .map(s => s.subtask_id.toString());
                const subtasksToDelete = existingSubtaskIds.filter(
                    id => !currentSubtaskIds.includes(id)
                );
                
                // 削除処理
                for (const subtaskId of subtasksToDelete) {
                    console.log(`サブタスク削除: ID=${subtaskId}`);
                    subtaskPromises.push(
                        ApiClient.task.deleteSubtask(subtaskId).catch(err => {
                            console.error(`サブタスク削除エラー: ID=${subtaskId}`, err);
                            subtaskErrors.push(`サブタスクID ${subtaskId} の削除に失敗: ${err.message}`);
                            return null;
                        })
                    );
                }
                
                // すべてのサブタスク処理を待機
                console.log('すべてのサブタスク処理を待機中...');
                const subtaskResults = await Promise.all(subtaskPromises);
                console.log('サブタスク処理完了:', subtaskResults);
                
                // エラーがある場合は警告を表示
                if (subtaskErrors.length > 0) {
                    console.warn('一部のサブタスク処理に失敗しました:', subtaskErrors);
                    alert(`タスクは更新されましたが、一部のサブタスク処理に失敗しました:\n${subtaskErrors.join('\n')}`);
                } else {
                    alert('タスクが正常に更新されました');
                }
                
                // タスク一覧ページにリダイレクト
                window.location.href = 'tasks.html';
            } catch (error) {
                console.error('タスク更新エラー詳細:', error);
                
                // エラーメッセージに詳細情報を追加
                let errorMsg = `タスク更新エラー: ${error.message}`;
                if (error.stack) {
                    console.error('スタックトレース:', error.stack);
                }
                
                // APIクライアントのエラー表示関数を使用
                ApiClient.displayError({
                    message: errorMsg,
                    originalError: error
                });
            }
        });
    }
}



/**
 * initTaskEditPage関数で呼び出される、タスク情報を読み込んでhtml要素に表示する関数
 * @param {string} taskId - 編集対象のタスクID
 */
async function loadTaskForEdit(taskId) {
    try {
        const task = await ApiClient.task.getTask(taskId);
        console.log('編集するタスク:', task);
        
        // hiddenフィールドにタスクIDをセット
        if (document.getElementById('task-id')) {
            document.getElementById('task-id').value = taskId;
        }
        
        // フォームに値を設定
        document.getElementById('task-name').value = task.task_name;
        document.getElementById('task-content').value = task.task_content || '';
        document.getElementById('recent-schedule').value = task.recent_schedule || '';
        document.getElementById('start-date').value = new Date(task.start_date).toISOString().split('T')[0];
        document.getElementById('due-date').value = new Date(task.due_date).toISOString().split('T')[0];
        document.getElementById('category').value = task.category;
        document.getElementById('target-time').value = task.target_time;
        document.getElementById('comment').value = task.comment || '';
        
        // サブタスクの読み込みと表示
        const subtasks = await ApiClient.task.getSubtasks(taskId);
        console.log('取得したサブタスク:', subtasks);
        
        const subtasksContainer = document.getElementById('subtasks-container');
        subtasksContainer.innerHTML = ''; // 既存のサブタスクをクリア
        
        if (subtasks && subtasks.length > 0) {
            // サブタスクを順番に追加
            for (const subtask of subtasks) {
                addSubtaskField({
                    subtask_id: subtask.subtask_id,
                    subtask_name: subtask.subtask_name,
                    contribution_value: subtask.contribution_value
                });
            }
        } else {
            // サブタスクがない場合は初期フィールドを追加
            addSubtaskField();
        }
        
        // タスクデータに含まれる日次計画値を使用（存在しない場合のみ均等分配計算を実行）
        console.log('取得したタスクの日次計画値を確認:', {
            daily_task_plans: task.daily_task_plans,
            daily_time_plans: task.daily_time_plans
        });
        
        if (task.daily_task_plans && task.daily_task_plans.length > 0) {
            console.log('タスクデータから日次作業計画値を使用');
            updateDailyTaskPlans(task.daily_task_plans);
        } else {
            console.log('タスクデータに日次作業計画値が存在しません。フォームは空のままにします。');
        }
        
        if (task.daily_time_plans && task.daily_time_plans.length > 0) {
            console.log('タスクデータから日次作業時間計画値を使用');
            updateDailyTimePlans(task.daily_time_plans);
        } else {
            console.log('タスクデータに日次作業時間計画値が存在しません。フォームは空のままにします。');
        }

        
    } catch (error) {
        console.error('タスク読み込みエラー:', error);
        alert('タスクの読み込みに失敗しました。');
    }
}



/**
 * サブタスクフィールドを追加
 * @param {Object} subtaskData - 既存のサブタスクデータ{subtask_id: 1, subtask_name: 'サブタスク1', contribution_value: 10}
 */
function addSubtaskField(subtaskData = null) {
    console.log('addSubtaskField関数が呼び出されました', subtaskData);
    // サブタスク入力フィールドが追加される親となるHTML要素（コンテナ）を取得し、container定数に格納
    const container = document.getElementById('subtasks-container');
    console.log('subtasks-container要素:', container);
    const index = container.children.length;
    console.log('現在のサブタスク数:', index);
    
    // 編集ページで呼び出されたときは、既存の値を使用して、サブタスクフィールドを追加
    if (subtaskData && subtaskData.subtask_id) {
        const contributionValue = subtaskData.contribution_value;
        console.log('既存のサブタスクデータを使用:', subtaskData);
        
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="${subtaskData.subtask_name || ''}" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="${contributionValue.toFixed(2)}" 
                           data-subtask-id="${subtaskData.subtask_id}"
                           step="0.01" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        // 生成したHTML文字列を、subtasks-container要素の閉じタグの直前（子要素の最後）に挿入
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('サブタスクHTMLを追加しました:', subtaskData.subtask_id);
        validateSubtaskContributions();

    } else {
        // 新規追加の場合は、まず要素を追加
        const subtaskName = subtaskData && subtaskData.subtask_name ? subtaskData.subtask_name : '';
        
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="${subtaskName}" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="0" 
                           data-subtask-id="null"
                           step="0.01" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('新規サブタスクHTMLを追加しました');
    }
}



/**
 * サブタスクを削除
 * @param {HTMLElement} button - 削除ボタン要素
 */
function removeSubtask(button) {
    // 削除ボタンの親要素のフィールド(サブタスク要素)を取得
    const row = button.closest('.subtask-row'); // closest:最も近い親要素
    
    // 選択した要素を削除
    row.remove();
}


// 日次作業計画値と日次作業時間計画値が更新されない！！！！！！！！！！！！！！！！！！！！！！！！！！！！

/**
 * 計画値の計算と表示更新
 */
function updatePlansAndContributions() {
    console.log('計画値の計算と表示更新を開始します');
    
    // フロントエンドで日次計画値を計算
    const data = calculateDailyPlans();
    
    if (!data) {
        console.log('計算に必要な値が不足しています');
        return;
    }
    
    // 計算結果を表示
    updateDailyTaskPlans(data.daily_task_plans);
    updateDailyTimePlans(data.daily_time_plans);
    
    // サブタスク貢献値を均等分配
    redistributeSubtaskContributions();
    
    console.log('計画値の計算と表示更新が完了しました');
}



/**
 * 日次作業計画値の更新
 */
function updateDailyTaskPlans(dailyTaskPlans) {
    const container = document.getElementById('daily-task-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTaskPlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-task-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-task-plan-value" 
                           value="${plan.task_plan_value.toFixed(2)}" step="0.01" min="0" max="100" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTaskPlans);
    });
}

/**
 * 日次作業時間計画値の更新
 */
function updateDailyTimePlans(dailyTimePlans) {
    const container = document.getElementById('daily-time-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTimePlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-time-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-time-plan-value" 
                           value="${plan.time_plan_value.toFixed(2)}" step="0.01" min="0" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業時間計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTimePlans);
    });
}





/**
 * 日次作業計画値のバリデーション
 */
function validateDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    const errorElement = document.getElementById('task-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業計画値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}



/**
 * 日次作業時間計画値のバリデーション
 */
function validateDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    const targetTime = parseFloat(document.getElementById('target-time').value || 0);
    const errorElement = document.getElementById('time-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 目標時間に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - targetTime) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業時間計画値の合計は目標作業時間（${targetTime}分）にしてください（現在: ${total.toFixed(2)}分）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}



/**
 * サブタスク貢献値のバリデーション
 */
function validateSubtaskContributions() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    const errorElement = document.getElementById('subtask-error');
    
    let total = 0;
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `サブタスクの作業貢献値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    // バリデーション結果のみを返す（自動調整は行わない）
    return isValid;
}



/**
 * フォーム送信処理
 * @param {Event} event - イベントオブジェクト
 */
async function handleTaskSubmit(event) {
    event.preventDefault();
    
    // バリデーション
    const isTaskPlansValid = validateDailyTaskPlans();
    const isTimePlansValid = validateDailyTimePlans();
    const isSubtasksValid = validateSubtaskContributions();
    
    if (!isTaskPlansValid || !isTimePlansValid || !isSubtasksValid) {
        return;
    }
    
    // フォームデータの収集
    const formData = {
        task_name: document.getElementById('task-name').value,
        task_content: document.getElementById('task-content').value,
        recent_schedule: document.getElementById('recent-schedule').value,
        start_date: document.getElementById('start-date').value,
        due_date: document.getElementById('due-date').value,
        category: document.getElementById('category').value,
        target_time: parseInt(document.getElementById('target-time').value),
        comment: document.getElementById('comment').value || '',
        
        // サブタスク情報
        subtasks: collectSubtasks(),
        
        // 日次作業計画値
        daily_task_plans: collectDailyTaskPlans(),
        
        // 日次作業時間計画値
        daily_time_plans: collectDailyTimePlans()
    };
    
    try {
        console.log('送信するタスクデータ:', formData);
        const createdTask = await ApiClient.task.createTask(formData);
        console.log('作成されたタスク:', createdTask);
        
        alert('タスクが正常に作成されました');
        
        // タスク一覧ページにリダイレクト
        window.location.href = 'tasks.html';
    } catch (error) {
        console.error('タスク作成エラー詳細:', error);
        ApiClient.displayError(error);
    }
}



/**
 * サブタスク情報の収集
 * @returns {Array} - サブタスク情報の配列
 */
function collectSubtasks() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    
    // 現在表示されているサブタスクの情報を収集
    const result = Array.from(subtasks).map(subtask => {
        const subtaskInput = subtask.querySelector('.subtask-contrib');
        // サブタスクIDを適切に取得（空文字や未定義の場合はnullに設定）
        let subtaskId = subtaskInput.dataset.subtaskId;
        
        // 空文字、"undefined"、undefined をすべてnullとして扱う
        subtaskId = (subtaskId && subtaskId.trim() !== '' && subtaskId !== 'undefined' && subtaskId !== 'null') ? parseInt(subtaskId) : null;
        
        // 名前と貢献値
        const subtaskName = subtask.querySelector('.subtask-name').value.trim();
        let contributionValue = parseFloat(subtaskInput.value) || 0;
        
        // 小数点以下2桁に丸める
        contributionValue = parseFloat(contributionValue.toFixed(2));
        
        console.log(`サブタスク収集: ID=${subtaskId}, 名前=${subtaskName}, 貢献値=${contributionValue}, 型=${typeof subtaskId}`);
        
        return {
            subtask_id: subtaskId,
            subtask_name: subtaskName,
            contribution_value: contributionValue
        };
    });
    
    // 合計値確認
    const total = result.reduce((sum, item) => sum + item.contribution_value, 0);
    console.log(`サブタスク貢献値合計: ${total.toFixed(2)}%`);
    
    // 合計が100でない場合は調整
    if (Math.abs(total - 100) > 0.1 && result.length > 0) {
        console.log('貢献値合計が100%でないため調整します');
        const adjustment = (100 - total) / result.length;
        for (let i = 0; i < result.length; i++) {
            result[i].contribution_value = parseFloat((result[i].contribution_value + adjustment).toFixed(2));
        }
        
        // 調整後の合計を再確認
        const adjustedTotal = result.reduce((sum, item) => sum + item.contribution_value, 0);
        console.log(`調整後サブタスク貢献値合計: ${adjustedTotal.toFixed(2)}%`);
    }
    
    return result;
}



/**
 * 日次作業計画値の収集
 * @returns {Array} - 日次作業計画値の配列
 */
function collectDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const plans = container.getElementsByClassName('daily-task-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            task_plan_value: parseFloat(plan.querySelector('.daily-task-plan-value').value)
        };
    });
}



/**
 * 日次作業時間計画値の収集
 * @returns {Array} - 日次作業時間計画値の配列
 */
function collectDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const plans = container.getElementsByClassName('daily-time-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            time_plan_value: parseFloat(plan.querySelector('.daily-time-plan-value').value)
        };
    });
}

/**
 * サブタスクの貢献値を均等に再分配
 */
function redistributeSubtaskContributions() {
    console.log('redistributeSubtaskContributions関数が呼び出されました');
    const container = document.getElementById('subtasks-container'); // サブタスクコンテナ
    const subtasks = container.querySelectorAll('.subtask-row'); // サブタスクコンテナ内のサブタスク要素の配列
    const count = subtasks.length; // サブタスクの数
    
    if (count === 0) {
        console.log('サブタスクが存在しないため処理を終了します');
        return;
    }
    
    // 100%を均等分配
    const equalContribution = (100 / count).toFixed(2);
    console.log(`${count}個のサブタスクに均等分配: ${equalContribution}%`);
    
    // 全てのサブタスクに均等な貢献値を設定
    subtasks.forEach((subtask, index) => {
        const input = subtask.querySelector('.subtask-contrib');
        input.value = equalContribution;
        console.log(`サブタスク${index + 1}の貢献値を${equalContribution}%に設定`);
    });
    
    // バリデーションを実行
    validateSubtaskContributions();
}



// ページ初期化処理の追加
document.addEventListener('DOMContentLoaded', function() {
    // 現在のページのパスを取得
    const currentPage = window.location.pathname.split('/').pop();
    
    // ページに応じた初期化関数を呼び出す
    if (currentPage === 'task-create.html') {
        initTaskCreationPage();
    } else if (currentPage === 'task-edit.html') {
        initTaskEditPage();
    } else if (currentPage === 'tasks.html') {
        // タスク一覧ページの初期化は tasks.html 内で直接 ApiClient を使用して行われます
        console.log('タスク一覧ページが読み込まれました');
    }
});



// グローバルに公開する関数
window.addSubtaskField = addSubtaskField;
window.removeSubtask = removeSubtask;
window.redistributeSubtaskContributions = redistributeSubtaskContributions;
window.validateSubtaskContributions = validateSubtaskContributions; 