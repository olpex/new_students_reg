// API route to provide Supabase configuration to the client
module.exports = (req, res) => {
  // Only provide the public anon key, never the service_role key
  res.status(200).json({
    url: process.env.SUPABASE_URL || 'https://yxzcwkqtzmrrdvkuiyan.supabase.co',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8'
  });
};
