import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home, FolderOpen, GitBranch, BarChart3 } from 'lucide-react'

export default function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  const getBreadcrumbName = (pathname, index) => {
    switch (pathname) {
      case 'repositories':
        return 'Repositories'
      case 'analyze':
        return 'Analysis'
      default:
        // For repo owner and name in /analyze/:owner/:repo
        if (pathnames[0] === 'analyze' && index === 1) {
          return pathnames[1] // owner
        }
        if (pathnames[0] === 'analyze' && index === 2) {
          return pathnames[2] // repo name
        }
        return pathname
    }
  }

  const getBreadcrumbIcon = (pathname, index) => {
    switch (pathname) {
      case 'repositories':
        return <FolderOpen className="h-4 w-4" />
      case 'analyze':
        return <BarChart3 className="h-4 w-4" />
      default:
        if (pathnames[0] === 'analyze' && index >= 1) {
          return <GitBranch className="h-4 w-4" />
        }
        return null
    }
  }

  const getBreadcrumbPath = (index) => {
    return '/' + pathnames.slice(0, index + 1).join('/')
  }

  if (pathnames.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link 
        to="/" 
        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      
      {pathnames.map((pathname, index) => {
        const isLast = index === pathnames.length - 1
        const path = getBreadcrumbPath(index)
        const name = getBreadcrumbName(pathname, index)
        const icon = getBreadcrumbIcon(pathname, index)
        
        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <div className="flex items-center space-x-1 text-gray-900 font-medium">
                {icon}
                <span>{name}</span>
              </div>
            ) : (
              <Link 
                to={path} 
                className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
              >
                {icon}
                <span>{name}</span>
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}