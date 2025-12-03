#!/bin/bash
# Prisma StudioをDIRECT_URLで起動するスクリプト
# このスクリプトを使用すると、接続プーラーをバイパスして直接データベースに接続します

export DIRECT_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres"
npx prisma studio

