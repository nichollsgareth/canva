class Tournament {
    constructor(teamsPerMatch, numberOfTeams) {
        
        this.rounds = ko.observableArray();
        this.tournamentId = ko.observable();
        this.teamsPerMatch = ko.observable(teamsPerMatch);
        this.numberOfTeams = ko.observable(numberOfTeams);
        this.currentMatchUps = ko.observableArray();
        this.setRounds();
        this.tournamentBoard = new ClientLayout(this.rounds());
    }
    
    async init() {
        await ClientDataAPI.createTournament(this.teamsPerMatch(), this.numberOfTeams())
        .then(response => {
            this.tournamentId(response.tournamentId);
            for (var i =0; i < response.matchUps.length; i++) {
                this.currentMatchUps().push(response.matchUps[i]);
            }
            return this;
        }).catch(e => {
            return e;
        });
        
    }  
    
    setRounds() {
        this.rounds = ko.observableArray();
        var numberOfTeamsPerRound = this.numberOfTeams();
        while (numberOfTeamsPerRound % this.teamsPerMatch() === 0) {
            numberOfTeamsPerRound = numberOfTeamsPerRound / this.teamsPerMatch();
            
            var currentRoundsMatches = ko.observableArray();
            for (var i = 0; i < numberOfTeamsPerRound; i++) {
                currentRoundsMatches.push(i);
            }
            this.rounds.push(currentRoundsMatches);
        }
    } 
};

class Round {
    
    constructor(tournament, teamCollection, viewModel) {
        this.tournamentId = ko.observable(tournament.tournamentId());
        this.teamsPerMatch = ko.observable(tournament.teamsPerMatch());
        this.matchUps = tournament.currentMatchUps();
        this.nextRoundMatchUps = ko.observableArray();
        this.tournamentBoard = tournament.tournamentBoard;
        this.roundNumber = 0;
        this.teamCollection = teamCollection;
        this.winner = 0;
        this.matchNumber = 0;
        this.viewModel = viewModel;
    }
    
    async initMatchups() { 
        console.log('initMatchups');
        var roundWinners = ko.observableArray();
        
        for (var m=0; m < this.matchUps.length;m++) {
            var matchUp = this.matchUps[m];
            console.log(matchUp);
            this.winner = await Match.getWinner(matchUp, this.tournamentId(), this.roundNumber, this.teamCollection);
            this.tournamentBoard.completeMatch();
            roundWinners.push(this.winner);
            if (roundWinners().length == this.teamsPerMatch()) {
                this.createMatch(roundWinners);
                roundWinners = ko.observableArray();
                if (((this.getMatchNumber() + 1) === this.matchUps.length) ||
                        ((this.getMatchNumber() + 1) === this.matchUps.length / this.teamsPerMatch())) {
                    await this.completeRound();
                }
                else {
                    this.matchNumber++;
                }
            }
        }
        if (roundWinners().length === 1) {
            console.log('get team details');
            this.teamCollection.getTeamDetails(this.tournamentId(), roundWinners()[0])
            .then( response => {
                this.viewModel.pageArgs.succMessage('Winner ' + response.teamName());
            });
            this.viewModel.pageArgs.winner('Team ' + roundWinners()[0]);
        }
        return roundWinners();
    }
    
    getMatchNumber() {
        return this.matchNumber + 1;
    }
    
    createMatch(teamIds) {
        this.nextRoundMatchUps.push({match:this.matchNumber, teamIds: teamIds()});
    }
    
    async completeRound() {
        this.matchNumber = 0;
        this.matchUps = this.nextRoundMatchUps();
        this.nextRoundMatchUps = ko.observableArray();
        this.roundNumber++;
        //recursively run through the matchups
        await this.initMatchups();
    }
}

class MatchUp {
    constructor(data) {
        this.match = ko.observable(data);
        this.teamIds = ko.observableArray();
    }
}

class Match  {
    constructor() {
        this.matchId = ko.observable();
        this.teams = ko.observableArray();
        this.winner = ko.observable();
        this.matchSize = ko.observable();
        this.matchScore = ko.observable();
    }
    
    static async getWinner(matchUp, tournamentId, roundNumber, teamCollection) {
        var teams = ko.observableArray();
        //var teamScores = ko.observableArray();
        var team = {};
        //first we have to get the match
        var matchScore = await ClientDataAPI.getMatch(tournamentId, roundNumber, matchUp.match);
        for (var t = 0; t < matchUp.teamIds.length; t++) {
            if (roundNumber === 0) {
                team = await teamCollection.getTeamDetails(tournamentId, matchUp.teamIds[t]);
                teamCollection.addTeam(team);
            } else {
                team = teamCollection.getTeam(matchUp.teamIds[t]);
            }
            teams().push(team);
        };
        var winnerTeamScore = await ClientDataAPI.getWinner(tournamentId, teams(), matchScore.score);
        var winningTeamId = this.findWinningTeam(teams(), winnerTeamScore.score);

        return winningTeamId;
    }
    
    static findWinningTeam(teams, winningTeamScore) {
        var winningTeamId = -1;
        for (var t = 0; t < teams.length; t++) {
            if (teams[t].teamScore() === winningTeamScore) {
                if (winningTeamId < 0) {
                    winningTeamId = teams[t].teamId();
                }
                else if (winningTeamId > teams[t].teamId()) {
                    winningTeamId = teams[t].teamId();
                }
            }
        }
        return winningTeamId;
    }
}

class Team {
    constructor(teamId, teamName, teamScore) {
        this.teamId = ko.observable(teamId),
        this.teamName = ko.observable(teamName),
        this.teamScore = ko.observable(teamScore)
    }
}

class TeamCollection {
    
    constructor() {
       this.teams = [];
    }
    
    getTeam(key) {
        for (var i = 0; i<this.teams.length; i++) {
            if (this.teams[i].teamId() === key) {
                return this.teams[i];
            }
        }
    }
    
    addTeam(team) {
        this.teams.push(team);
    }
    
    async getTeamDetails(tournamentId, teamId) {
        var team = await ClientDataAPI.getTeam(tournamentId, teamId);
        return new Team(team.teamId, team.name, team.score);
    }
}

class ClientLayout {
    constructor(rounds) {
        this.currentMatch = 0;
        this.rounds = rounds;
    }
    
    clearBoard() {
        var tournamentBoardDiv = document.getElementById('tournamentBoard');
        tournamentBoardDiv.innerHTML = '';
        this.currentMatch = 0;
    }
    
    completeMatch() {
        var matchDiv = document.getElementById('match_'+this.currentMatch);
        matchDiv.className = matchDiv.className + ' match_square_complete';
        this.currentMatch++;
    }
    
    createBoard() {
        var matchCounter=0;
        var tournamentBoardDiv = document.getElementById('tournamentBoard');
        for (var r=0; r < this.rounds.length; r++) {
            var roundDiv = document.createElement('div');
            var titleLabel = document.createElement('label');
            titleLabel.innerHTML = 'Round ' + r;
            roundDiv.appendChild(titleLabel);
            tournamentBoardDiv.appendChild(roundDiv);
            for (var m=0; m < this.rounds[r]().length; m++) {
                var matchDiv = document.createElement('div');
                matchDiv.setAttribute('id', `match_${matchCounter}`);
                matchDiv.className = 'match_square';
                roundDiv.appendChild(matchDiv);
                matchCounter++;
            }
        }
    }
}