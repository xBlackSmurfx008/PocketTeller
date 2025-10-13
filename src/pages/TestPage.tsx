// Minimal test page to verify iOS WebView is working
export default function TestPage() {
  return (
    <div style={{
      backgroundColor: '#7C3AED',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        ✅ iOS WebView Working!
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>
        PocketTeller Test Page
      </p>
      <p style={{ fontSize: '14px', opacity: 0.9 }}>
        If you see this, the app is rendering.
      </p>
      <div style={{ marginTop: '40px', fontSize: '14px', textAlign: 'center' }}>
        <p>Platform: iOS</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

