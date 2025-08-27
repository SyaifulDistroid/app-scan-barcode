import { useState } from "react";
import QrScanner from "react-qr-scanner";

export default function ScanPage() {
  const [data, setData] = useState<string>("");

  return (
    <div className="p-4">
      <h1>Scan Barcode</h1>
      <QrScanner
        delay={300}
        onError={(err) => console.error(err)}
        onScan={(result) => {
          if (result) setData(result.text);
        }}
        style={{ width: "300px" }}
      />
      {data && <p>Barcode: {data}</p>}
    </div>
  );
}
