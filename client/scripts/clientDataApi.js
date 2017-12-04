class ClientDataAPI {
    
    static async createTournament(teamsPerMatch, numberOfTeams) {
        
        var request = new Request('/tournament', {
            method: 'POST',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            body: 'teamsPerMatch='+teamsPerMatch+'&numberOfTeams='+numberOfTeams
        });
        
        try {
            var response = await fetch(request);
            return await response.json();
        }
        catch (ex) {
            return ex;
        }
        
        return null;
    }
    
    static async getMatch(tournamentId, roundNumber, matchId) {
        
        var request = new Request('/match?tournamentId='+tournamentId+'&round='+roundNumber+'&match='+matchId, {
            method: 'GET'
        });
        
        try {
            var response = await fetch(request);
            return await response.json();
        }
        catch (ex) {
            return ex;
        }
        
        return null;
    }
    
    static async getTeam(tournamentId, teamId) {
      var request = new Request('/team?tournamentId='+tournamentId+'&teamId='+teamId, { method: 'GET' });

      try {
          var response = await fetch(request);
          return await response.json();
      } 
      catch (ex) {
          return ex;
      }

      return null;
    }
    
    static async getWinner(tournamentId, teams, matchScore) {
        
        var teamUrl = ''
        for (var t = 0; t < teams.length; t++) {
            var teamScore = teams[t].teamScore();            
            teamUrl = teamUrl + '&teamScores='+teamScore;
        }
        
        var request = new Request('/winner?tournamentId='+tournamentId +'' + teamUrl + '&matchScore=' + matchScore, {
            method: 'GET'
        });
        
        try {
            var response = await fetch(request);
            return await response.json();
        }
        catch (ex) {
            return ex;
        }
        
        return null;
    }
}

