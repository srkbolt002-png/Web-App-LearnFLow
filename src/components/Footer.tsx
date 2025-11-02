import { Link } from 'react-router-dom';
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-gradient">LearnFlow</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Streamlined learning management for academic departments.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary smooth-transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-primary smooth-transition">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary smooth-transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-muted-foreground hover:text-primary smooth-transition">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h3 className="font-semibold mb-4">For Instructors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/instructor" className="text-muted-foreground hover:text-primary smooth-transition">
                  Instructor Dashboard
                </Link>
              </li>
              <li>
                <Link to="/instructor/home" className="text-muted-foreground hover:text-primary smooth-transition">
                  Teaching Guidelines
                </Link>
              </li>
              <li>
                <Link to="/instructor/workshops" className="text-muted-foreground hover:text-primary smooth-transition">
                  Workshop Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary smooth-transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary smooth-transition flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Contact Department Admin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LearnFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}