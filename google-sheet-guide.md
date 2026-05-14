# Google Sheets 結構規劃 (縱向排列設計)

這是一份建議的 Google Sheets 格式參考。為了符合您的閱讀與管理習慣，這些資料會以**「縱向排列 (直排)」**為主，也就是每一列代表一筆獨立的資料。

請在您要與 Apps Script 連動的 Google 試算表中建立以下三個工作表 (Tabs)：

---

### 表 1: `Projects` (專案列表)
第一列為標題，第二列開始由上而下新增個別的專案資料。

| A (Project Name)           | B (Default Deadline)   |
| :------------------------- | :--------------------- |
| Skysport_Vizday_26         | 5/19 all on air        |
| Drone AR_26                | 6/1 beta release       |
| Virtual Studio Promo       | 7/15 delivery          |
| Webcast Stage A            | 12/20 final check      |
| ... (接下來的專案依序往下填) | ...                    |

---

### 表 2: `Phrases` (常用語)
這張表專門用來管理快捷片語，您可以隨時新增不同分類。同樣第一列為標題，後續一列列由上而下新增。

| A (Category) | B (Phrase)                             |
| :----------- | :------------------------------------- |
| 製作要求     | build in Viz                           |
| 製作要求     | export with Alpha                      |
| 時間通知     | Before the end of today                |
| 時間通知     | Before the end of this week            |
| 時間通知     | Before the end of this month           |
| 時間通知     | ASAP                                   |
| 格式說明     | 1920x1080 60p MP4                      |
| 格式說明     | PNG Sequence                           |
| 格式說明     | Apple ProRes 4444                      |
| 其它         | use client's updated logo              |
| 其它         | send to QA team first                  |
| ...          | ...                                    |

---

### 表 3: `Logs` (選配/自動紀錄)
如果在介面中點選了「Copy Slack Msg」，並且您有透過 Apps Script 啟用日誌功能，腳本將會自動將紀錄「一行一行往下」附加到此頁籤。如果您只想自己查看，也可以不填內容，讓程式自動生成標題與新紀錄即可。

| A (Timestamp)              | B (User) | C (Message Preview)                                                           |
| :------------------------- | :------- | :---------------------------------------------------------------------------- |
| 5/14/2026 10:15:30         | PM       | *Project Name:* Skysport_Vizday_26\n*Project Deadline:* 5/19...      |
| 5/14/2026 15:42:11         | PM       | *Project Name:* Drone AR_26\n*Project Deadline:* 6/1 beta release... |
| ...                        | ...      | ...                                                                           |

---

### Apps Script (GAS) 部署提醒
確保您已將在右上角「GS Settings」填寫的 URL 部署為**「網頁應用程式 (Web App)」**，並且權限設定為**「所有人 (Anyone)」**，這樣不論誰開啟這個版面都能直接抓到此 Sheets 裡的最新的資料！
