/// <reference types="cypress">

describe('Test with backend', () => {
    beforeEach('log in to the app', () => {
        cy.loginToApplication();
    })

    it('verify correct request and response', () => {
        cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticles');

        cy.contains('New Article').click();
        cy.get('[formcontrolname="title"]').type('This is the title');
        cy.get('[formcontrolname="description"]').type('This is the description');
        cy.get('[formcontrolname="body"]').type('This is the body of the article');
        cy.contains('Publish Article').click();

        cy.wait('@postArticles').then(xhr => {
            console.log(xhr);
            expect(xhr.response.statusCode).to.equal(201);
            expect(xhr.request.body.article.body).to.equal('This is the body of the article');
            expect(xhr.response.body.article.description).to.equal('This is the description');
        })

        // Delete the created Article manually to avoid unexpected failure.
    })

    it('intercepting and modifying the request and response', () => {
        // cy.intercept('POST', '**/articles', (req) => {
        //    req.body.article.description = "This is EDITED description!!!"
        // }).as('postArticles');

        cy.intercept('POST', '**/articles', (req) => {
            req.reply(res => {
                console.log(res);
                expect(res.body.article.description).to.eq('This is the description');
                res.body.article.description = "This is EDITED description!!!";
            })
        }).as('postArticles');

        cy.contains('New Article').click();
        cy.get('[formcontrolname="title"]').type('This is the title');
        cy.get('[formcontrolname="description"]').type('This is the description');
        cy.get('[formcontrolname="body"]').type('This is the body of the article');
        cy.contains('Publish Article').click();

        cy.wait('@postArticles').then(xhr => {
            console.log(xhr);
            expect(xhr.response.statusCode).to.equal(201);
            expect(xhr.request.body.article.body).to.equal('This is the body of the article');
            expect(xhr.response.body.article.description).to.equal('This is EDITED description!!!');
        })
        cy.get('.btn-outline-danger').eq(1).click();
    })

    it('verify popular tags are displayed', () => {
        cy.intercept({method: 'GET', path: '**/tags'}, {fixture: 'tags.json'}).as('getTags');
        cy.wait('@getTags');
        cy.get('.tag-list')
            .should('contain', 'cypress')
            .and('contain', 'automation')
            .and('contain', 'test');

    })

    it('Verify global feed likes count', ( () => {
        cy.intercept('GET', 'https://api.realworld.io/api/articles*', {fixture: 'articles.json'});

        cy.contains('Global Feed').click();
        cy.get('app-article-list button').then( heartList => {
            expect(heartList[0]).to.contain('30');
            expect(heartList[1]).to.contain('45');
        })

        cy.fixture('articles').then(file => {
            const articleLink = file.articles[1].slug;
            const articleFavCount = file.articles[1].favoritesCount;
            cy.intercept('POST', `https://api.realworld.io/api/articles/${articleLink}/favorite`, file);
            cy.get('app-article-list button').eq(1).click().should('contain', articleFavCount + 1)
        });
    }))

    it.only('Testing API Call: Delete Article', () => {
        const bodyRequest = {
            article: {
                tagList: [],
                title: 'Request from API',
                description: 'API testing easy',
                body: 'Angular is Cool!'
            }
        }

        cy.get('@token').then(token => {
                cy.request({
                    url: 'https://api.realworld.io/api/articles/',
                    headers: { Authorization: 'Token ' + token },
                    method: 'POST',
                    body: bodyRequest
                }).then(response => {
                    expect(response.status).to.eq(201);
                })

                cy.contains('Global Feed').click();
                cy.get('.article-preview').first().should('not.contain', 'Loading articles');
                cy.get('.article-preview').first().click();
                cy.get('.btn-outline-danger').eq(1).click();

                cy.request({
                    url: 'https://api.realworld.io/api/articles?limit=10&offset=0',
                    headers: { Authorization: 'Token ' + token },
                    method: 'GET',
                }).its('body').then(body => {
                    expect(body.articles[0].title).not.to.eq('Request from API');
                })
            })
    });
})