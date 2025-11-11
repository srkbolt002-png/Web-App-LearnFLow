import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, User, LogOut, Menu, X, Download } from 'lucide-react';
import { APP_CONFIG } from '@/lib/appConfig';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { getAvatarColor } from '@/lib/avatarColors';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
export function Navbar() {
  const {
    user,
    logout
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const getHomeRoute = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/super-admin';
    if (user.role === 'department_admin') return '/department-admin';
    if (user.role === 'instructor') return '/instructor/home';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'student') return '/student/dashboard';
    return '/';
  };
  const isActive = (path: string) => location.pathname === path;
  const avatarColor = user ? getAvatarColor(user.name) : '';
  return <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm' : 'bg-background/50 backdrop-blur-sm'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={getHomeRoute()} className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl educational-gradient shadow-md group-hover:shadow-lg transition-all">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold">LearnFlow</span>
        </Link>
        
        {user && <nav className="hidden md:flex gap-6">
            <Link to={getHomeRoute()} className={`font-medium smooth-transition relative ${isActive(getHomeRoute()) ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              {user.role === 'student' ? 'My Learning' : user.role === 'super_admin' ? 'Super Admin' : user.role === 'department_admin' ? 'Department' : 'Home'}
              {isActive(getHomeRoute()) && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
            </Link>
            <Link to="/courses" className={`font-medium smooth-transition relative ${isActive('/courses') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Courses
              {isActive('/courses') && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
            </Link>
            {(user.role === 'student' || user.role === 'instructor') && <>
              {user.role === 'student' && <>
                <Link to="/student/workshops" className={`font-medium smooth-transition relative ${isActive('/student/workshops') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                  Workshops
                  {isActive('/student/workshops') && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
                </Link>
                <Link to="/student/progress" className={`font-medium smooth-transition relative ${isActive('/student/progress') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                  Progress
                  {isActive('/student/progress') && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
                </Link>
                <a 
                  href={APP_CONFIG.androidApkUrl} 
                  download={APP_CONFIG.apkFileName}
                  className="font-medium smooth-transition text-foreground hover:text-primary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download App
                </a>
              </>}
            </>}
            {user.role === 'instructor' && <>
                <Link to="/instructor" className={`font-medium smooth-transition relative ${isActive('/instructor') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                  Dashboard
                  {isActive('/instructor') && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
                </Link>
                <Link to="/instructor/workshops" className={`font-medium smooth-transition relative ${isActive('/instructor/workshops') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                  Workshops
                  {isActive('/instructor/workshops') && <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"></span>}
                </Link>
              </>}
          </nav>}
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationCenter />
          
          {user ? <>
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-primary/20" style={{
                  backgroundColor: avatarColor
                }}>
                      <AvatarFallback className="text-black dark:text-white font-semibold">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border-2" align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {user && mobileMenuOpen && <div className="md:hidden border-t bg-card animate-in slide-in-from-top">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link to={getHomeRoute()} className={`px-4 py-2 rounded-md smooth-transition ${isActive(getHomeRoute()) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
              {user.role === 'student' ? 'My Learning' : 'Home'}
            </Link>
            <Link to="/courses" className={`px-4 py-2 rounded-md smooth-transition ${isActive('/courses') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
              Courses
            </Link>
            {user.role === 'student' && <>
                <Link to="/student/workshops" className={`px-4 py-2 rounded-md smooth-transition ${isActive('/student/workshops') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
                  Workshops
                </Link>
                <Link to="/student/progress" className={`px-4 py-2 rounded-md smooth-transition ${isActive('/student/progress') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
                  Progress
                </Link>
                <a 
                  href={APP_CONFIG.androidApkUrl} 
                  download={APP_CONFIG.apkFileName}
                  className="px-4 py-2 rounded-md smooth-transition hover:bg-accent flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Download className="h-4 w-4" />
                  Download App
                </a>
              </>}
            {user.role === 'instructor' && <>
                <Link to="/instructor" className={`px-4 py-2 rounded-md smooth-transition ${isActive('/instructor') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/instructor/workshops" className={`px-4 py-2 rounded-md smooth-transition ${isActive('/instructor/workshops') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`} onClick={() => setMobileMenuOpen(false)}>
                  Workshops
                </Link>
              </>}
          </nav>
        </div>}
    </header>;
}