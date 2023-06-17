GITHUB_REPO:=kohshi54/42HoursTuning2023
GITHUB_ADDKEY_URL:=https://github.com/$(GITHUB_REPO)/settings/keys/new

GITIGNORE_PATH:=$(HOME)/.gitignore
ZSHRC_PATH:=$(HOME)/.zshrc
VIMRC_PATH:=$(HOME)/.vimrc

ALP_CONFIG_DIR:=$(HOME)/tool-config/alp
ALP_CONFIG:=$(ALP_CONFIG_DIR)/config.yml
TRDSQL_DIR:=$(HOME)/tool-config/trdsql
TRDSQL_SQL:=$(TRDSQL_DIR)/access.sql

.PHONY: setup
setup: keygen install-tools oh-my-zsh zsh-setup

.PHONY: keygen
keygen:
	ssh-keygen -t rsa -N '' -f ~/.ssh/id_rsa
	cat ~/.ssh/id_rsa.pub
	echo "Add this key to the repository $(GITHUB_ADDKEY_URL)"

.PHONY: install-tools
install-tools:
	# apt install
	sudo apt update
	sudo apt upgrade -y
	sudo apt install -y percona-toolkit dstat git unzip snapd graphviz tree net-tools iotop apache2-utils
	# alp
	wget https://github.com/tkuchiki/alp/releases/download/v1.0.9/alp_linux_amd64.zip \
		&& unzip alp_linux_amd64.zip \
		&& sudo install ./alp /usr/local/bin/alp \
		&& rm alp_linux_amd64.zip alp
	mkdir -p $(ALP_CONFIG_DIR)
	wget https://raw.githubusercontent.com/usatie/isucon-setup/main/tool-config/alp/config.yml -O $(ALP_CONFIG)
	# trdsql
	wget https://github.com/noborus/trdsql/releases/download/v0.10.0/trdsql_v0.10.0_linux_amd64.zip \
		&& unzip trdsql_v0.10.0_linux_amd64.zip \
		&& sudo install ./trdsql_v0.10.0_linux_amd64/trdsql /usr/local/bin/trdsql \
		&& rm -rf trdsql_v0.10.0_linux_amd64.zip trdsql_v0.10.0_linux_amd64
	mkdir -p $(TRDSQL_DIR)
	wget https://raw.githubusercontent.com/usatie/isucon-setup/main/tool-config/trdsql/access.sql -O $(TRDSQL_SQL)

.PHONY: oh-my-zsh
oh-my-zsh:
	sudo apt update
	sudo apt upgrade
	sudo apt install -y zsh
	sh -c "$$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

.PHONY: zsh-setup
zsh-setup:
	# zsh-autosuggestions
	git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
	@echo "# zsh-setup"
	@echo 'export VISUAL=vim' >> $(ZSHRC_PATH)
	@echo 'export EDITOR="$$VISUAL"' >> $(ZSHRC_PATH)
	@echo 'plugins+=(zsh-autosuggestions)' >> $(ZSHRC_PATH)
	@echo 'source $$ZSH/oh-my-zsh.sh' >> $(ZSHRC_PATH)
	@echo 'export PATH=$$HOME/local/go/bin:$$HOME/go/bin:$$PATH' >> $(ZSHRC_PATH)
	@echo 'export GOROOT=$$HOME/local/go' >> $(ZSHRC_PATH)
	@echo 'Restart zsh by "exec $$SHELL"'

.PHONY: vim-setup
vim-setup:
	@echo "# vim-setup"
	@echo 'set term=xterm-256color' >> $(VIMRC_PATH)
	@echo 'syntax on' >> $(VIMRC_PATH)
	@echo 'set tabstop=4' >> $(VIMRC_PATH)
	@echo 'set shiftwidth=4' >> $(VIMRC_PATH)
	@echo 'set autoindent' >> $(VIMRC_PATH)
	@echo 'set number' >> $(VIMRC_PATH)
	@echo "set viminfo='100,<200,s10,h" >> $(VIMRC_PATH)
