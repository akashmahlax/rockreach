import Link from "next/link"

export default function FooterSection() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground font-bold text-sm font-serif">
                L
              </div>
              <span className="font-serif text-xl font-medium tracking-tight">LogiGrow</span>
            </div>
            <p className="text-sm text-muted-foreground font-sans max-w-xs leading-relaxed">
              AI-powered lead generation and email outreach platform for modern sales teams.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-6 font-sans uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs/guide" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-6 font-sans uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-6 font-sans uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Terms of use
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-sans">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground font-sans">
          <p>&copy; {new Date().getFullYear()} LogiGrow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
