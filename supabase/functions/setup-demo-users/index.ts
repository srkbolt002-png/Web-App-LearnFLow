import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Simple setup - just create super admin
    const demoUsers = [
      { email: 'super@admin.com', name: 'Super Admin' }
    ];

    const results = [];
    const password = '12345678';

    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.some(u => u.email === user.email);

      if (userExists) {
        results.push({ email: user.email, status: 'already_exists' });
        continue;
      }

      // Create the user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      });

      if (error) {
        results.push({ email: user.email, status: 'error', error: error.message });
      } else if (data.user) {
        // Assign super_admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: data.user.id, role: 'super_admin' })
          .select();
        
        if (roleError) {
          results.push({ 
            email: user.email, 
            status: 'created_without_role', 
            id: data.user.id,
            roleError: roleError.message 
          });
        } else {
          results.push({ 
            email: user.email, 
            status: 'created_with_super_admin_role', 
            id: data.user.id 
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users setup completed',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
