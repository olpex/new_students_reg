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
  
  // Set default Supabase URL and key with your actual credentials
  window.SUPABASE_URL = 'https://yxzcwkqtzmrrdvkuiyan.supabase.co';
  window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8';
  
  // Still try to load from server in case there are updated values
  fetch('/api/supabase-config')
    .then(response => response.json())
    .then(config => {
      window.SUPABASE_URL = config.url || window.SUPABASE_URL;
      window.SUPABASE_KEY = config.key || window.SUPABASE_KEY;
      console.log('Supabase configuration loaded from server');
    })
    .catch(error => {
      console.warn('Failed to load Supabase configuration from server, using default values:', error);
    });
})();
