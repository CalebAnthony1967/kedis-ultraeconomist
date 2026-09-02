import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FolderTree, Layers } from 'lucide-react';

export default function DomainTree({
  data = [],
  selectedDomainId = null,
  selectedSubdomainId = null,
  onSelectDomain = () => {},
  onSelectSubdomain = () => {},
  className = '',
}) {
  const [expandedDomains, setExpandedDomains] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleDomain = (domainId) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domainId]: !prev[domainId],
    }));
  };

  // Group data by domain
  const domains = data.reduce((acc, item) => {
    const domainKey = item.domain_id;
    if (!acc[domainKey]) {
      acc[domainKey] = {
        id: domainKey,
        code: item.domain_code,
        name: item.domain_name,
        subdomains: [],
      };
    }
    if (item.subdomain_id) {
      acc[domainKey].subdomains.push({
        id: item.subdomain_id,
        code: item.subdomain_code,
        name: item.subdomain_name,
        count: item.indicator_count || 0,
      });
    }
    return acc;
  }, {});

  const domainList = Object.values(domains);

  // Filter by search term
  const filteredDomains = searchTerm
    ? domainList.filter(domain =>
        domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.subdomains.some(s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : domainList;

  if (domainList.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <FolderTree className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No domains found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter domains..."
          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Domain List */}
      {filteredDomains.map((domain) => {
        const isExpanded = expandedDomains[domain.id] || searchTerm.length > 0;
        const subdomains = domain.subdomains;

        return (
          <div key={domain.id} className="border-b border-border/50 last:border-0">
            {/* Domain Header */}
            <button
              onClick={() => toggleDomain(domain.id)}
              className="w-full flex items-center gap-2 py-2 hover:bg-secondary/30 rounded-lg transition-colors px-2"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-semibold text-foreground truncate flex-1">
                {domain.name}
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                {subdomains.length}
              </span>
            </button>

            {/* Subdomains */}
            {isExpanded && (
              <div className="ml-6 pb-1 space-y-0.5">
                {subdomains.map((subdomain) => {
                  const isActive = selectedSubdomainId === subdomain.id;
                  return (
                    <button
                      key={subdomain.id}
                      onClick={() => onSelectSubdomain(subdomain.id)}
                      className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs
                        transition-colors
                        ${isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-secondary/30 text-muted-foreground'
                        }
                      `}
                    >
                      <span className="truncate flex-1">{subdomain.name}</span>
                      {subdomain.count > 0 && (
                        <span className={`text-[10px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          ({subdomain.count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
