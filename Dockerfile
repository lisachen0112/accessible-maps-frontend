FROM python:3.8
WORKDIR /python-docker
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
EXPOSE 80
CMD [ "python3", "-m" , "flask", "--app", "main.py", "run", "--host=0.0.0.0", "--port=80"]