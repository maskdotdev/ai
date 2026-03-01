# Base image
FROM cbw5803/aima-devbox:latest

# Set the working directory
WORKDIR /root

# Install pandoc on docker 
RUN apt-get update && apt-get install -y pandoc texlive-full texlive-xetex texlive-latex-extra\
 texlive-fonts-recommended texlive-plain-generic

# add configuration file for jupyter notebook to remove all the authentication 
RUN mkdir -p ~/.jupyter && echo "c.NotebookApp.token = ''" >> ~/.jupyter/jupyter_notebook_config.py

# change workdir 
WORKDIR /opt/aima-python 

# Set the default jupyter notebook running command. Add bash after docker run override this 
CMD ["jupyter", "notebook", "--ip=0.0.0.0", "--allow-root"]
