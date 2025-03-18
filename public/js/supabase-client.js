// Supabase client initialization script
(function() {
  // Create a global supabaseClient object
  window.supabaseClient = {
    createClient: function(supabaseUrl, supabaseKey) {
      // Basic validation
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key are required');
      }
      
      // Return a Supabase client-like object with basic functionality
      return {
        from: function(table) {
          return {
            select: function(columns) {
              return {
                eq: function(column, value) {
                  return fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`
                    }
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error('Supabase API error');
                    }
                    return response.json();
                  })
                  .then(data => ({ data, error: null }))
                  .catch(error => ({ data: null, error }));
                },
                then: function(resolve, reject) {
                  return fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns || '*'}`, {
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`
                    }
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error('Supabase API error');
                    }
                    return response.json();
                  })
                  .then(data => resolve({ data, error: null }))
                  .catch(error => resolve({ data: null, error }));
                }
              };
            },
            insert: function(records) {
              return fetch(`${supabaseUrl}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(records)
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Supabase API error');
                }
                return response.json();
              })
              .then(data => ({ data, error: null }))
              .catch(error => ({ data: null, error }));
            },
            delete: function() {
              return {
                eq: function(column, value) {
                  return fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
                    method: 'DELETE',
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`
                    }
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error('Supabase API error');
                    }
                    return response.json();
                  })
                  .then(data => ({ data, error: null }))
                  .catch(error => ({ data: null, error }));
                }
              };
            }
          };
        }
      };
    }
  };
  
  // Try to load Supabase URL and key from environment variables
  // This will be set by Vercel using the environment variables
  fetch('/api/supabase-config')
    .then(response => response.json())
    .then(config => {
      window.SUPABASE_URL = config.url;
      window.SUPABASE_KEY = config.key;
      console.log('Supabase configuration loaded from server');
    })
    .catch(error => {
      console.warn('Failed to load Supabase configuration from server:', error);
    });
})();
