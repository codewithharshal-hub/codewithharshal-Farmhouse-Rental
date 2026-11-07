import { Link } from "react-router-dom";

export default function Footer() {
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        alert("Thank you for subscribing to our newsletter!");
    };

    return (
        <footer className="footer-advanced">
            {/* Top Banner / Newsletter Section */}
            <div className="footer-newsletter-section">
                <div className="container newsletter-content">
                    <div className="newsletter-text">
                        <h3>Stay Updated with Farmhouse Getaways</h3>
                        <p>Subscribe to get special offers, hidden farmhouse deals & updates.</p>
                    </div>
                    <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                        <input
                            type="email"
                            placeholder="Enter your email address..."
                            required
                        />
                        <button type="submit">
                            <span>Subscribe</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="footer-main">
                <div className="container footer-grid">

                    {/* Column 1: About Brand */}
                    <div className="footer-col">
                        <h2 className="footer-logo">🌾 Farmhouse Rental</h2>
                        <p className="footer-desc">
                            Discover peaceful stays away from city chaos. Book luxury farmhouses for weekends, parties, family gatherings, or list your own property with ease.
                        </p>
                        <div className="social-icons">
                            {/* Facebook Icon */}
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            {/* Instagram Icon */}
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            {/* Twitter Icon */}
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                            </a>
                            {/* Youtube Icon */}
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"></polygon></svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="footer-col">
                        <h3>Quick Links</h3>
                        <ul className="footer-links-list">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/farmhouses">Explore Farmhouses</Link></li>
                            <li><Link to="/list-property">List Your Farmhouse</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Contact Info (Gmail & Phone) */}
                    <div className="footer-col">
                        <h3>Get in Touch</h3>
                        <ul className="contact-info-list">
                            <li>
                                <span className="contact-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </span>
                                <span>123 Green Valley Road, Nature City, India</span>
                            </li>
                            <li>
                                <span className="contact-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                </span>
                                <a href="tel:+919876543210">+91 98765 43210</a>
                            </li>
                            <li>
                                <span className="contact-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </span>
                                <a href="mailto:support@farmhouserental.com">support@farmhouserental.com</a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Policies & Admin Access */}
                    <div className="footer-col">
                        <h3>Legal & Admin</h3>
                        <ul className="footer-links-list">
                            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms & Conditions</Link></li>
                            <li><Link to="/cancellation">Cancellation Policy</Link></li>
                            <li className="admin-link-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <Link to="/admin-login" className="admin-highlight-link">Admin Portal</Link>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Copyright Bar */}
            <div className="footer-bottom">
                <div className="container bottom-flex">
                    <p>© {new Date().getFullYear()} Farmhouse Rental. All rights reserved.</p>
                    <p className="made-with">Designed with ❤️ for peaceful stays.</p>
                </div>
            </div>
        </footer>
    );
}