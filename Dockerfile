FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY benedicte.jpg /usr/share/nginx/html/benedicte.jpg
COPY logob.jpg /usr/share/nginx/html/logob.jpg
COPY makeup1.jpg /usr/share/nginx/html/makeup1.jpg
COPY makeup2.jpg /usr/share/nginx/html/makeup2.jpg
COPY makeup3.jpg /usr/share/nginx/html/makeup3.jpg
COPY makeup5.jpg /usr/share/nginx/html/makeup5.jpg
COPY makeup6.jpg /usr/share/nginx/html/makeup6.jpg
COPY makeup7.jpg /usr/share/nginx/html/makeup7.jpg
COPY makeup8.jpg /usr/share/nginx/html/makeup8.jpg
COPY makeup9.jpg /usr/share/nginx/html/makeup9.jpg
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
