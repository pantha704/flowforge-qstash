export default function Page() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>FlowForge API (QStash)</h1>
      <p>Serverless API endpoints:</p>
      <ul>
        <li>POST /api/auth/signup</li>
        <li>POST /api/auth/signin</li>
        <li>GET /api/zap</li>
        <li>POST /api/zap</li>
        <li>GET /api/trigger/available</li>
        <li>GET /api/action/available</li>
        <li>POST /api/hooks/[userId]/[zapId]</li>
        <li>POST /api/worker (QStash callback)</li>
      </ul>
    </div>
  );
}
