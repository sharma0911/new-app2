export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Periskope Webhook Receiver</h1>
      <p>Your webhook endpoint is live at: <code>/api/webhook</code></p>
      <p>View received webhook data by visiting: <code>/api/webhook</code></p>
    </div>
  )
}
