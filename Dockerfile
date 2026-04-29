FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY benedicte.jpg /usr/share/nginx/html/benedicte.jpg
COPY logob.jpg /usr/share/nginx/html/logob.jpg
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
