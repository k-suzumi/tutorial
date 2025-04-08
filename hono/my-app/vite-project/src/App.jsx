import { useState } from 'react'
import './App.css'

function App() {
  const [configString, setConfigString] = useState('') // configStringの状態を管理

  const handleChange = (e) => {
    setConfigString(e.target.value) // テキストエリアの入力をstateにセット
  }

  return (
    <>
      <h1>config編集</h1>
      <form action="/submit-config" method="POST">
        <label htmlFor="config">設定内容:</label><br />
        <textarea
          id="config"
          name="config"
          required
          value={configString} // 状態をvalueにセット
          onChange={handleChange} // 入力変更を監視
        ></textarea><br /><br />
        <input type="submit" value="リクエストを送信" />
      </form>
    </>
  )
}

export default App
