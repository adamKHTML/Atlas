<?php

namespace App\Entity;

use App\Repository\AnalyticsRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AnalyticsRepository::class)]
class Analytics
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $entity_name = null;

    #[ORM\Column(nullable: true)]
    private ?int $views = null;

    #[ORM\Column(nullable: true)]
    private ?int $comments = null;

    #[ORM\Column(nullable: true)]
    private ?int $likes = null;

    #[ORM\Column(nullable: true)]
    private ?int $discussions = null;

    #[ORM\ManyToOne(inversedBy: 'analytics')]
    private ?Country $Country = null;

    #[ORM\ManyToOne(inversedBy: 'analytics')]
    private ?Discussion $Discussion = null;

    #[ORM\ManyToOne(inversedBy: 'analytics')]
    private ?Message $Message = null;

    #[ORM\ManyToOne(inversedBy: 'analytics')]
    private ?Quiz $Quiz = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEntityName(): ?string
    {
        return $this->entity_name;
    }

    public function setEntityName(?string $entity_name): static
    {
        $this->entity_name = $entity_name;

        return $this;
    }

    public function getViews(): ?int
    {
        return $this->views;
    }

    public function setViews(?int $views): static
    {
        $this->views = $views;

        return $this;
    }

    public function getComments(): ?int
    {
        return $this->comments;
    }

    public function setComments(?int $comments): static
    {
        $this->comments = $comments;

        return $this;
    }

    public function getLikes(): ?int
    {
        return $this->likes;
    }

    public function setLikes(?int $likes): static
    {
        $this->likes = $likes;

        return $this;
    }

    public function getDiscussions(): ?int
    {
        return $this->discussions;
    }

    public function setDiscussions(?int $discussions): static
    {
        $this->discussions = $discussions;

        return $this;
    }

    public function getCountry(): ?Country
    {
        return $this->Country;
    }

    public function setCountry(?Country $Country): static
    {
        $this->Country = $Country;

        return $this;
    }

    public function getDiscussion(): ?Discussion
    {
        return $this->Discussion;
    }

    public function setDiscussion(?Discussion $Discussion): static
    {
        $this->Discussion = $Discussion;

        return $this;
    }

    public function getMessage(): ?Message
    {
        return $this->Message;
    }

    public function setMessage(?Message $Message): static
    {
        $this->Message = $Message;

        return $this;
    }

    public function getQuiz(): ?Quiz
    {
        return $this->Quiz;
    }

    public function setQuiz(?Quiz $Quiz): static
    {
        $this->Quiz = $Quiz;

        return $this;
    }
}
