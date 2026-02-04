using System;
using Npgsql;

try {
    var connString = "Host=aws-1-ap-south-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.hiptfgmsyzwlihqssojk;Password=0022nEE@tEn**;SSL Mode=Require;Trust Server Certificate=true";
    using var conn = new NpgsqlConnection(connString);
    Console.WriteLine("Connecting to aws-1-ap-south-1.pooler.supabase.com on 5432...");
    conn.Open();
    Console.WriteLine("Connection successful!");
    using var cmd = new NpgsqlCommand("SELECT version()", conn);
    var version = cmd.ExecuteScalar();
    Console.WriteLine("DB Version: " + version);
} catch (Exception ex) {
    Console.WriteLine("Error: " + ex.Message);
}
