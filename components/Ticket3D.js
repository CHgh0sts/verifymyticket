/**
 * Représentation 3D d'un billet de concert (décoratif).
 */
export default function Ticket3D() {
  return (
    <div className="ticket-3d-scene" aria-hidden="true">
      <div className="ticket-3d">
        <div className="ticket-3d__face">
          <div className="ticket-3d__accent" />
          <div className="ticket-3d__body">
            <div className="ticket-3d__top">
              <span className="ticket-3d__brand">VerifyMyTicket</span>
              <span className="ticket-3d__status">VÉRIFIÉ</span>
            </div>
            <h3 className="ticket-3d__event">Live Session · Paris</h3>
            <p className="ticket-3d__meta">Stade de France · 17 juil. 2026</p>
            <div className="ticket-3d__row">
              <div>
                <span className="ticket-3d__label">Bloc</span>
                <span className="ticket-3d__value">K12</span>
              </div>
              <div>
                <span className="ticket-3d__label">Rang</span>
                <span className="ticket-3d__value">14</span>
              </div>
              <div>
                <span className="ticket-3d__label">Siège</span>
                <span className="ticket-3d__value">08</span>
              </div>
            </div>
          </div>
          <div className="ticket-3d__stub">
            <div className="ticket-3d__qr" />
            <span className="ticket-3d__stub-code">•••• 4821</span>
          </div>
        </div>
        <div className="ticket-3d__shadow" />
      </div>
    </div>
  );
}
