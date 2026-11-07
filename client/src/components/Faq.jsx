import { useState } from "react";

export default function Faq({ items }) {
    const [open, setOpen] = useState(0);

    return (
        <div className="hm-faq">
            {items.map((item, i) => {
                const isOpen = open === i;

                return (
                    <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.q}>
                        <button type="button" className="faq-q" aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? -1 : i)}>
                            <span>{item.q}</span>
                            <span className="plus" aria-hidden="true">+</span>
                        </button>
                        <div className="faq-a">
                            <div>
                                <p>{item.a}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}