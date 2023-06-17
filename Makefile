GITHUB_REPO:=kohshi54/42HoursTuning2023
GITHUB_ADDKEY_URL:=https://github.com/$(GITHUB_REPO)/settings/keys/new

GITIGNORE_PATH:=$(HOME)/.gitignore
ZSHRC_PATH:=$(HOME)/.zshrc
VIMRC_PATH:=$(HOME)/.vimrc

REPO_DIR:=$(HOME)/42HoursTuning2023
APP_DIR:=$(REPO_DIR)/app
BENCH_DIR:=$(REPO_DIR)/benchmarker

TOOL_CONFIG_DIR:=$(REPO_DIR)/tool-config

ALP_CONFIG_DIR:=$(TOOL_CONFIG_DIR)/alp
ALP_CONFIG:=$(ALP_CONFIG_DIR)/config.yml
TRDSQL_DIR:=$(TOOL_CONFIG_DIR)/trdsql
TRDSQL_SQL:=$(TRDSQL_DIR)/access.sql

DURATION=120
RESULT_DIR:=$(REPO_DIR)/results
RESULT_TOP_DIR:=$(RESULT_DIR)/top
RESULT_DSTAT_DIR:=$(RESULT_DIR)/dstat
# RESULT_APP_DIR:=$(RESULT_DIR)/app
RESULT_SLOW_DIR:=$(RESULT_DIR)/slow
RESULT_ALP_DIR:=$(RESULT_DIR)/alp

NGINX_LOGDIR:=$(APP_DIR)/nginx/log
NGINX_LOG:=$(NGINX_LOGDIR)/access.log
NGINX_ERROR_LOG:=$(NGINX_LOGDIR)/error.log
DB_LOGDIR:=$(APP_DIR)/mysql/log
DB_SLOW_LOG:=$(DB_LOGDIR)/mysql-slow.log
DB_ERROR_LOG:=$(DB_LOGDIR)/error.log

.PHONY: top
top:
	mkdir -p $(RESULT_TOP_DIR)
	$(eval n := $(shell (ls -l $(RESULT_TOP_DIR) || echo 1) | wc | awk '{print $$1}'))
	LINES=20 top -b -d 1 -n $(DURATION) -w > $(RESULT_TOP_DIR)/$(n).log

.PHONY: dstat
dstat:
	mkdir -p $(RESULT_DSTAT_DIR)
	$(eval n := $(shell (ls -l $(RESULT_DSTAT_DIR) || echo 1) | wc | awk '{print $$1}'))
	dstat -tcdm --tcp -n 1 $(DURATION) > $(RESULT_DSTAT_DIR)/$(n).log

.PHONY: slow-query
slow-query:
	mkdir -p $(RESULT_SLOW_DIR)
	$(eval n := $(shell (ls -l $(RESULT_SLOW_DIR) || echo 1) | wc | awk '{print $$1}'))
	#sudo pt-query-digest --explain h=$(MYSQL_HOST),u=$(MYSQL_USER),p=$(MYSQL_PASS) $(DB_SLOW_LOG) \
	#	| tee $(RESULT_SLOW_DIR)/$(n).digest
	pt-query-digest $(DB_SLOW_LOG) \
		| tee $(RESULT_SLOW_DIR)/$(n).digest

.PHONY: bench
bench: rotate
	# Stats
	$(MAKE) top &
	$(MAKE) dstat &
	cd $(BENCH_DIR) && ./run_k6_and_score.sh
	$(MAKE) slow-query
	$(MAKE) alp

.PHONY: build
build:
	cd $(APP_DIR) && docker compose build

.PHONY: restart
restart:
	cd $(APP_DIR) && docker compose up -d

.PHONY: rotate
rotate:
	sudo truncate $(NGINX_LOG) -s 0
	sudo truncate $(NGINX_ERROR_LOG) -s 0
	sudo truncate $(DB_SLOW_LOG) -s 0
	sudo truncate $(DB_ERROR_LOG) -s 0
	make restart

.PHONY: alp
alp:
	mkdir -p $(RESULT_ALP_DIR)
	$(eval n := $(shell (ls -l $(RESULT_ALP_DIR) || echo 1) | wc | awk '{print $$1}'))
	alp ltsv --file=$(NGINX_LOG) --config=$(ALP_CONFIG) \
		| tee $(RESULT_ALP_DIR)/$(n).digest

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
