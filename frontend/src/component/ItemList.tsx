import { useEffect, useState } from "react";

export default function ItemList() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/items")
      .then((res) => res.json())
      .then(setItems);
  }, []);

  return (
    <div className="p-4">
      <h1>Daftar Barang</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} (Stock: {item.stock}) - 
            <a href={`http://localhost:8080/barcode/${item.id}`} target="_blank" rel="noreferrer">
              Lihat QR
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
