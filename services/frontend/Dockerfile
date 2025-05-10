FROM nginx:alpine

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルド済みのファイルをNginxのhtmlディレクトリにコピー
COPY src/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 