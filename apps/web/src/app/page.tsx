const phaseZeroItems = [
  'Authoritative Sub0 transaction contracts',
  'Tenant-safe browser BFF boundary',
  'Fenced worker and quota primitives',
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="consera-title">
        <p className="eyebrow">CONSER A / PHASE 0</p>
        <h1 id="consera-title">Know what every AI shift means for your product.</h1>
        <p className="lede">
          Consera is building the evidence, authorization, and recovery contracts before
          product data is connected.
        </p>
      </section>
      <section className="gate" aria-labelledby="gate-title">
        <div>
          <p className="eyebrow">CURRENT SAFETY GATE</p>
          <h2 id="gate-title">Platform contracts are not connected yet.</h2>
        </div>
        <span className="status">Local bootstrap</span>
      </section>
      <section aria-labelledby="foundation-title">
        <h2 id="foundation-title">What is being verified</h2>
        <ul className="foundation-list">
          {phaseZeroItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
