# About AccessAble Maps
Link video: https://youtu.be/VTRB6Doytb0

AccessAble Maps is a web application we developed with the aim to support people with mobility difficulties and help them to navigate in their city. The web platform allows users to explore and discover disability-friendly venues, including public places, restaurants and attractions, and plan their journey to ensure they have a comfortable and enjoyable experience. Focused on optimising user experience, our platform’s goal is to empower our users and make them believe they are Able to do anything!
# Key Features
Interactive Map Exploration: Upon entering the app, users are able to browse the map and search for a place they would like to visit, for example Pret A Manger or the Science Museum.
Comprehensive Place Information: The search result would pop up with all the places found that match their search, and clicking on a search results reveals detailed information about the place, such as a picture of the place, their phone number, address, link to their website and reviews from other users.
Personalised Journey Planning: The app customises routes based on user preferences and needs, like wheelchair accessibility or step-free requirements, ensuring a tailored and optimised experience. Users are also able to choose their departure location and choose some additional settings (if they have a wheelchair or a cane, if they want step free access,etc...). Our app then calculates and plans the best journey to their desired location depending on their unique needs, and guides them through their journey, including the estimated time to arrival.
User Engagement: Users can contribute by posting their reviews, sharing valuable and relevant insight about the accessibility of different locations. The reviews include a rating out of 5 and a text review of the place, where users can give their opinion on the accessibility features of the place and other comments.
Account Management: Our account management service allows users to register and create an account. On their account, users can manage and see their reviews.
# Architecture Overview
Our web application leverages a hybrid microservice architecture using both Azure Functions (severless) and Azure Container Instances (container runtime). Each microservice is containerised and pushed to GHCR to facilitate the usage of Docker Compose. This ensures scalability, flexibility and robust performance. As of now, our system is composed of four microservices:
Front-end Service: The front-end service is a container instance built using Flask, HTML, CSS and JavaScript. It serves as the user interface as well as acting as the service which directs the request to different microservices.
Places and Reviews Service: The places and reviews is a container instance built using Python. It manages and retrieves place information via Google Maps API integration, sending a request to the API to get all of the places that match the user’s input and relevant details required, returning the combined information. It also retrieves the user’s and places’ reviews from the database using a get request, and saves reviews to the database using a post request.
     
 Journey Planning Service: The journey planning service is a serverless function built using Python. It is dedicated to planning the journey from the departure point to the arrival point, mapping out accessible routes, considering varied user mobility requirements.
Account Management Service: The account management service is a serverless function built using Python. It handles account functionalities, such as requests to create an account or login, allowing users to access their saved data efficiently (such as reviews they have posted) via get requests to the relevant endpoints.
The decision of using container instances for the frontend service and the places and reviews service was a logical strategy as these are the services that are likely to be most used by a user: a user could be interested in looking up a certain place to view its accessibility or might want to explore a city and compare different places to see the reviews and accessibility for a future visit and therefore might not want the directions to get to the location just yet.
# Development Process
Each microservice was independently developed, tested and deployed by a member of the team, facilitating continuous integration and ensuring streamlined and seamless updates. Each microservice uses its individual continuous integration and continuous deployment (CI/CD) pipelines. Subsequently, they are deployed to either Azure Functions or Azure Container Instances, depending on their operational requirements for production. The microservices are then integrated into the front-end microservice to deliver a smooth running web application.
## CI/CD Pipelines
To maintain high standards of code and reliability, each microservice contains two parallel pipelines: a development pipeline for ongoing updates and enhancements, and a production pipeline for live deployments. Both pipelines are structured with Python formatting checks, unit and coverage testing with a mandatory threshold of over 80%. Additionally, the pipeline includes building and pushing the Docker image. However, the image is only built if the code passes the initial formatting and testing stages, otherwise, the image build process is halted, which ensures that only reviewed and vetted code can progress through the pipeline. The production pipeline distinguishes itself by the extra step which deploys the finalised service to the appropriate Azure service (serverless function or container instance).
## Unit and Coverage Testing
Each local environment is fully equipped for unit testing and coverage verification, so developers are able to ensure that the service is functional and the code performs well before committing changes. The ongoing development of services and continuous integration is facilitated by pushing updates to a dedicated ‘dev’ branch, which allows developers to build the image with the new feature, without pushing it to production. On the other hand, the production pipeline commits the code to the main branch, and allows deployment to Azure services. This ensures a robust development process, which is reliable, scalable and responsive to evolving needs of the users.
## Integration Testing
We incorporated Docker Compose for integration testing, allowing us to simulate the combined operation of our microservices in an environment which mirrors production. We defined a multi-container setup by creating a YAML file to define the services and spin all the microservices with a single command. This strategy is essential in validating the interactions of our microservices, ensuring that the services communicate and function together as expected, before deployment for production. In that way, we are able to run and test the integrated system locally, accelerating the development process as we are able to identify issues in the integration early on and ensure the reliability of the software. The entire system can be simulated, using for example development databases for the user authentication and reviews. Additionally, the developer is able to decide what tag for the image to use (each microservice is deployed to GHCR with a prod tag and a dev tag), therefore enabling the testing of different environments.
# Engineering decisions
Our engineering decisions were carefully decided to address concerns of flexibility, scalability, reliability, cost-efficiency and performance optimisation.
## Flexibility
The hybrid microservice architecture of our web application allows for great flexibility as each microservice is a standalone service and can work independently, but communicate effectively with the frontend microservice. Therefore, the app can grow in functionality easily, by creating new microservices and making them integrate with the existing frontend. For example, the account management service is not fully integrated into the main product. However, thanks to the flexible architecture of our web app, completing this integration would be a straightforward process, showcasing the advantages of this architecture.
## Scalability
We used Azure serverless functions and container instances in order to cater to our scalability needs. As Azure serverless functions have built-in load-balancing built-in, they are able to scale automatically as the traffic increases. On the other hand, Azure container instances do not have a load balancer, meaning that if scaling was required, the development team would have to manually scale the microservice horizontally, which is not desirable. Nevertheless, we decided to keep the container instances for now, as they are suitable for our current traffic demands. However, as the web app becomes more popular and scaling becomes necessary, a transition to Azure Container Apps or even Azure Kubernetes Service might be necessary, which would allow us to maintain optimal performance as user demand continues to grow.
## Reliability
Our CI/CD pipeline, as mentioned above, is tailored for both development and production environments, which ensures reliability of each service. Once formatting checks and unit and coverage testing are passed, ensuring sufficiently tested features, and the service is deployed to Azure, we can leverage the notion of deployment slots in Azure’s serverless functions. Each microservice that is deployed to a serverless function has a production CI/CD pipeline that deploys to the production deployment slot and a development one that deploys to the development deployment slot. The two slots, that have different URLs, can be swapped in the Azure dashboard, meaning that the URL of the serverless function that is being used by the users (production environment) will be now routed to the development environment. We can use the swapping of deployment slots to perform blue/green deployments. This method minimises downtime and risks associated with new releases: we can swap production to development (users will now use the dev version of the microservice), monitor the behaviour, and if there are no concerns, merge the development to production in GitHub (triggering the pipeline) and deploy, or otherwise swap back (prod returns to the previous state, that we assume is the stable one).
For Azure container instances, which do not have deployment slots, therefore we leveraged Docker Compose to ensure smooth integration and reliability of the service, by monitoring locally the integration of the system.
To further ensure reliability, we introduced monitoring in the serverless functions: whenever a certain threshold of bad requests has been detected, signifying that there is something off in the microservice, the developers will be notified, this tries to ensure that any possible bugs are picked up as soon as possible.
An improvement to make it even more robust would be to add automated rollback to the previous stable version once an anomaly has been detected, so that we can guarantee a working service to the users with as little down time as possible.
## Cost-Efficiency
As our web application has not been commercially released yet, we chose to keep our service simple, hence why we opted for a combination of serverless functions and azure container instances, as it allows us to keep the cost low without sacrificing service quality. Note that, given the traffic that we receive now, the container instances logically should also be serverless functions. However, as the app gains popularity, we would expect this current architecture to be financially convenient given that the price of frequently triggered serverless functions is greater than a single Azure Container Instance. This approach reflects a balanced consideration of current and future needs of our platform, keeping operational costs low during the initial stages, while giving us the flexibility to upscale in a cost-efficient manner.
## Performance
To optimise performance and ensure a good user experience, we made sure our website was loading quickly by reducing the number of calls to the backend, thereby accelerating loading times. As our app fetches the details of the places that match the user’s search (for example Pret A Manger) during the request to find the places, it reduces latency when a user clicks on one of the results to get more information on a certain place. This is because there is no need for another call to the backend, so it instantly loads the information of the place they are interested in.
Moreover, by introducing caching, popular places that are searched frequently would be faster to load as no call would be made to the backend. Implementing caching is a strategy that helps reduce the latency of the website by caching frequently accessed data, making it instantly available for subsequent requests, ultimately improving the users experience on the website.
# Future improvements
While AccessAble Maps has a good foundation, we believe it can be evolved and expanded for an ultimate user experience.
## Incorporating Real-Time Disruptions
Incorporating Real-Time Disruptions and weather forecasts is a strategic enhancement aimed at providing users with the most current travel information and optimising journeys in light of potential disruptions. This feature is integrated into the new travel information service, which centralises data on transport alerts, weather conditions, and journey planning algorithms. By providing a real-time transport and weather disruption alerts enables the app to offer dynamic journey adjustments and recommendations, ensuring users can make informed travel decisions and accommodate any disruptions. This enhances user satisfaction by proactively addressing and mitigating travel uncertainties, improving conveniences.
## Broader Disability Inclusivity
By integrating this within the user experience service to enhance adaptability, this aids users’ travels, irrespective of their physical or sensory challenges. We are profoundly committed to making commuting accessible to everyone with the combination of technology, ensuring a barrier-free user experience across the application.
## Dynamic GPS Integration
This would upgrade the map functionality by incorporating real-time GPS tracking, which dynamically updates the map as the user moves. This feature ensures that users have the most accurate and current location information at their disposal.This enhancement ensures that the map dynamically updates in accordance with the user's movements, offering a more interactive and responsive navigation experience. The goal of this incorporation is to enhance route accuracy and functionalities.
## Saved Places and Journey Features
This would be integrated into the account management microservice, organising information on locations, encompassing addresses, descriptions, and potential ratings or reviews. Crucially, it enables users to store data on specific journeys, including start and end points, preferred routes, and any stops in between. Users can also choose to receive notifications about their saved locations or journeys, including traffic updates, new reviews, and current weather conditions. Additionally, this system tailors personalised recommendations and journey optimizations based on user preferences and real-time conditions, enhancing the overall account management service.
## Global Expansion
We intend to help users planning a journey in their hometown or navigating new cities abroad, they will have access to reliable, accessible navigation tools. This not only democratises access to mobility for users with disabilities on a global scale but also sets a new standard for inclusive travel and venue access worldwide, reinforcing the app's commitment to universal accessibility and user empowerment.
Finally, given all these improvements and features that we are planning to introduce, we can conclude that the choice of the current architecture is well suited to achieve this in a timely and smooth manner as each feature can be either added to an existing microservice or more microservices can be introduced.
