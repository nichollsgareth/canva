var Client = (function () {
    
    var viewModel = new ClientModel({});
    
    function init() {
        ko.applyBindings(viewModel);
    };
    
    async function startTournament() {
        console.log("start tournament");
        viewModel.pageArgs.winner(null);
        viewModel.pageArgs.errMessage(null);
        viewModel.pageArgs.succMessage(null);
        
        var tournament = new Tournament(viewModel.pageArgs.teamsPerMatch(), viewModel.pageArgs.numberOfTeams());
        await tournament.init()
        .catch(e => {
            generalCallbackError(e);
        });
            tournament.tournamentBoard.clearBoard();
            tournament.tournamentBoard.createBoard();
            var teamCollection = new TeamCollection();
            var round =
             new Round(tournament, teamCollection, viewModel);
            await round.initMatchups().catch(e => {
                generalCallbackError(e);
            });
    };
    
    function generalCallbackError(data) {

        viewModel.pageArgs.errMessage(data.responseJSON.message);
    };
    
    return {
        init: init,
        startTournament: startTournament
    };
})();

function ClientModel() {
    var self = this;
    self.pageArgs = {
        teamsPerMatch : ko.observable(),
        numberOfTeams : ko.observable(),
        winner : ko.observable(),
        errMessage : ko.observable(),
        succMessage : ko.observable()
    };
}