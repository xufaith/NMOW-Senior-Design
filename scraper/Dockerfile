FROM public.ecr.aws/lambda/python:3.10

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY lambda_function.py ./

RUN yum install -y unzip && \
    curl -LO https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip -d /usr/local/bin/ && \
    rm chromedriver_linux64.zip && \
    yum install -y https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

CMD ["lambda_function.lambda_handler"]