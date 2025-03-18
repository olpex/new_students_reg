// API route to provide Supabase configuration to the client
module.exports = (req, res) => {
  // Only provide the public anon key, never the service_role key
  res.status(200).json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  });
};
